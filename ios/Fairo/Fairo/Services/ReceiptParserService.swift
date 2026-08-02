import Foundation

struct ParsedReceipt {
    var merchantName: String
    var items: [LineItem]
    var adjustments: [BillAdjustment]
    var subtotal: Decimal
    var tax: Decimal
    var total: Decimal
    var currencyCode: String
}

enum ReceiptParserService {
    static let sampleText = """
    The Green Table
    123 Main Street
    2026-08-02

    2x Cappuccino        9.00
    Avocado Toast       14.50
    Side Salad           6.00
    10% Loyalty Off     -2.95

    Subtotal            26.55
    Tax                  2.12
    Total               28.67
    """

    static func parse(text: String, currencyCode: String) -> ParsedReceipt {
        let detectedCurrency = detectCurrency(in: text) ?? currencyCode
        let lines = normalizeLines(text)

        let merchant = detectMerchant(from: lines)
        let totalsStart = lines.firstIndex(where: isTotalsSectionStart) ?? lines.count
        let itemLines = lines[..<totalsStart].filter { isLikelyItemLine($0) }
        let totalsLines = Array(lines[totalsStart...])

        var items: [LineItem] = []
        var adjustments: [BillAdjustment] = []

        for line in itemLines {
            if let adjustment = detectAdjustment(line) {
                adjustments.append(adjustment)
                continue
            }
            if let item = parseItemLine(line) {
                items.append(item)
            }
        }

        var subtotal: Decimal = 0
        var tax: Decimal = 0
        var total: Decimal = 0

        for line in totalsLines {
            let lower = line.lowercased()
            guard let amount = trailingAmount(line) else { continue }

            if lower.contains("subtotal") || lower.contains("total excl") {
                subtotal = amount
            } else if lower.contains("service charge") || lower.contains("admin fee") {
                adjustments.append(BillAdjustment(
                    label: line,
                    amount: abs(amount),
                    adjustmentType: .serviceCharge,
                    handling: .unresolved
                ))
            } else if lower.contains("tax") || lower.contains("vat") || lower.contains("output tax") {
                tax = amount
            } else if lower.contains("to pay") || lower.contains("amount due") {
                total = amount
            } else if lower.contains("total") && !lower.contains("subtotal") && !lower.contains("excl") {
                if total == 0 { total = amount }
            }
        }

        if subtotal == 0 {
            subtotal = items.filter { !$0.isDisregarded }.map(\.lineTotal).reduce(0, +)
        }
        if total == 0 {
            total = subtotal + tax + adjustments.map(\.amount).reduce(0, +)
        }

        return ParsedReceipt(
            merchantName: merchant,
            items: items,
            adjustments: adjustments,
            subtotal: MoneyService.round(subtotal, currencyCode: detectedCurrency),
            tax: MoneyService.round(tax, currencyCode: detectedCurrency),
            total: MoneyService.round(total, currencyCode: detectedCurrency),
            currencyCode: detectedCurrency
        )
    }

    // MARK: - Normalization

    private static func normalizeLines(_ text: String) -> [String] {
        let raw = text.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        let merged = mergeSplitReceiptLines(raw)
        return merged.filter { !shouldSkipLine($0) }
    }

    /// Join item names with orphan prices on the next line, and `@` unit-price lines with line totals.
    private static func mergeSplitReceiptLines(_ lines: [String]) -> [String] {
        var merged: [String] = []
        var index = 0

        while index < lines.count {
            let line = lines[index]

            if index + 1 < lines.count {
                let next = lines[index + 1]

                if line.contains("@"), trailingAmount(line) == nil, isPriceOnlyLine(next) {
                    merged.append("\(line) \(next)")
                    index += 2
                    continue
                }

                if trailingAmount(line) == nil,
                   looksLikeItemDescription(line),
                   isPriceOnlyLine(next) {
                    merged.append("\(line) \(next)")
                    index += 2
                    continue
                }
            }

            merged.append(line)
            index += 1
        }
        return merged
    }

    private static func isPriceOnlyLine(_ line: String) -> Bool {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        let lower = trimmed.lowercased()
        if lower.contains("total") || lower.contains("subtotal") || lower.contains("tax") { return false }
        return trimmed.range(of: #"^[\$R£€]?\s*\d[\d,.\s]*$"#, options: .regularExpression) != nil
    }

    private static func looksLikeItemDescription(_ line: String) -> Bool {
        let lower = line.lowercased()
        if lower.contains("total") || lower.contains("subtotal") { return false }
        if lower == "eat in" || lower == "take away" || lower == "takeaway" { return false }
        return line.range(of: #"^\d+\s+\S"#, options: .regularExpression) != nil
            || line.range(of: #"^\d+\s*[x×X]"#, options: .regularExpression) != nil
    }

    private static func shouldSkipLine(_ line: String) -> Bool {
        let lower = line.lowercased()
        if lower.count < 2 { return true }
        if line.filter({ $0 == "_" }).count > 4 { return true }
        if isPriceOnlyLine(line) { return true }

        let skipContains = [
            "tel:", "phone:", "vat #", "vat no", "transaction type", "authorization:",
            "payment code", "payment id", "card reader", "customer copy", "thank you",
            "please call again", "please come again", "add us on instagram", "nedbank",
            "approved", "visa card", "mastercard", "entry:", "ref:", "status:",
            "gratuity", "signature", "gaap point", "opened:", "ordered:",
            "chk ", "tbl ", "gst ", "covers:", "staff:", "tax inv", "rrn:",
            "terminal", "custom copy", "tip is not included", "www.", "http",
            "pay with cash", "output tax", "total excl",
        ]
        if skipContains.contains(where: { lower.contains($0) }) { return true }

        let skipPrefixes = [
            "d:", "t:", "v:", "r:", "n:", "b:", "txn:", "a:", "i:",
            "server:", "host:", "table ", "check #", "order:", "name:",
            "card:", "type:", "time:",
        ]
        if skipPrefixes.contains(where: { lower.hasPrefix($0) }) { return true }

        if lower.range(of: #"^\d{1,2}[a-z]{3}'?\d{2}\s+\d"#, options: .regularExpression) != nil {
            return true
        }

        return false
    }

    // MARK: - Merchant

    private static func detectMerchant(from lines: [String]) -> String {
        let header = lines.prefix(12)
        for line in header {
            let lower = line.lowercased()
            if lower.contains("restaurant") || lower.contains("cafe") || lower.contains(" room")
                || lower.contains("lifestyle") || lower.contains("cabana") || lower.contains("woolworths") {
                return cleanMerchantName(line)
            }
        }
        for line in header {
            if line.count >= 4, line.count <= 40, line.contains(where: \.isLetter),
               trailingAmount(line) == nil, !shouldSkipLine(line),
               !line.contains(where: { $0.isNumber && line.filter(\.isNumber).count > 4 }) {
                return cleanMerchantName(line)
            }
        }
        return "Receipt"
    }

    private static func cleanMerchantName(_ line: String) -> String {
        line.replacingOccurrences(of: #"\s{2,}"#, with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespaces)
    }

    // MARK: - Currency

    private static func detectCurrency(in text: String) -> String? {
        if text.range(of: #"\bR\s?\d"#, options: .regularExpression) != nil { return "ZAR" }
        if text.contains("R") && text.lowercased().contains("vat #") { return "ZAR" }
        if text.contains("$") { return "USD" }
        if text.range(of: #"£\s?\d"#, options: .regularExpression) != nil { return "GBP" }
        if text.range(of: #"€\s?\d"#, options: .regularExpression) != nil { return "EUR" }
        return nil
    }

    // MARK: - Totals section

    private static func isTotalsSectionStart(_ line: String) -> Bool {
        let lower = line.lowercased()
        if lower.contains("@") { return false }
        if lower.range(of: #"^\d+\s+\S"#, options: .regularExpression) != nil,
           trailingAmount(line) != nil,
           !lower.contains("subtotal") && !lower.contains("total") && !lower.contains("tax") {
            return false
        }
        return lower.contains("subtotal")
            || lower.contains("sales tax")
            || (lower.contains("tax:") || lower.hasSuffix(" tax"))
            || lower.contains("to pay")
            || lower.contains("amount due")
            || (lower.contains("total") && !lower.contains("quantity"))
    }

    private static func isLikelyItemLine(_ line: String) -> Bool {
        guard trailingAmount(line) != nil else { return false }
        let lower = line.lowercased()
        if lower.contains("subtotal") || lower.contains("to pay") { return false }
        if lower.contains("total") && !lower.contains("@") && !lower.hasPrefix("1 ")
            && !lower.hasPrefix("2 ") && !lower.hasPrefix("3 ") && !lower.hasPrefix("4 ")
            && !lower.hasPrefix("5 ") && !lower.hasPrefix("6 ") && !lower.hasPrefix("7 ")
            && !lower.hasPrefix("8 ") && !lower.hasPrefix("9 ") {
            return false
        }
        return true
    }

    // MARK: - Amount parsing

    private static func trailingAmount(_ line: String) -> Decimal? {
        let patterns = [
            #"[\$R£€]\s*([\d\s,]+\.\d{2})\s*$"#,
            #"([\d\s,]+\.\d{2})\s*$"#,
            #"[\$R£€]\s*([\d\s,]+)\s*$"#,
            #"([\d]+)\s*$"#,
        ]
        for pattern in patterns {
            guard let match = line.range(of: pattern, options: .regularExpression) else { continue }
            let matched = String(line[match])
            if let amount = parseAmountString(matched) { return amount }
        }
        return nil
    }

    private static func parseAmountString(_ raw: String) -> Decimal? {
        var cleaned = raw
            .replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: "R", with: "")
            .replacingOccurrences(of: "£", with: "")
            .replacingOccurrences(of: "€", with: "")
            .trimmingCharacters(in: .whitespaces)

        cleaned = cleaned.replacingOccurrences(of: ", ", with: "")
        if cleaned.contains(" ") && cleaned.contains(".") {
            cleaned = cleaned.replacingOccurrences(of: " ", with: "")
        }
        cleaned = cleaned.replacingOccurrences(of: ",", with: "")

        guard let decimal = Decimal(string: cleaned) else { return nil }
        return decimal
    }

    // MARK: - Item parsing

    private static func parseItemLine(_ line: String) -> LineItem? {
        if let item = parseAtPriceLine(line) { return item }
        if let item = parseQuantityLine(line) { return item }
        if let item = parseColonPriceLine(line) { return item }
        return nil
    }

    /// `2 Sprite 330ml @ 19.00 38.00` or `2 Sprite 330ml @ 19.00` (computes line total)
    private static func parseAtPriceLine(_ line: String) -> LineItem? {
        guard line.contains("@") else { return nil }
        let parts = line.split(separator: "@", maxSplits: 1).map(String.init)
        guard parts.count == 2 else { return nil }

        let left = parts[0].trimmingCharacters(in: .whitespaces)
        guard let qtyMatch = left.range(of: #"^(\d+)\s+"#, options: .regularExpression) else { return nil }

        let qty = Int(left[qtyMatch].filter(\.isNumber)) ?? 1
        let name = String(left[qtyMatch.upperBound...]).trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return nil }

        if qty > 50 {
            if let lineTotal = trailingAmount(line) {
                return makeItem(name: left, quantity: 1, lineTotal: lineTotal, confidence: 0.65)
            }
            return nil
        }

        if let lineTotal = trailingAmount(line) {
            return makeItem(name: name, quantity: qty, lineTotal: lineTotal)
        }

        let unitPart = parts[1].trimmingCharacters(in: .whitespaces)
        guard let unitPrice = parseAmountString(unitPart.components(separatedBy: " ").first ?? unitPart) else {
            return nil
        }
        let lineTotal = unitPrice * Decimal(qty)
        return makeItem(name: name, quantity: qty, lineTotal: lineTotal)
    }

    /// `1 Beef Brg 80.00`, `2x Cappuccino 9.00`, `2X CAESAR SALAD $24.00`
    private static func parseQuantityLine(_ line: String) -> LineItem? {
        guard let lineTotal = trailingAmount(line) else { return nil }
        var remainder = line
        if let priceRange = line.range(of: #"[\$R£€]?\s*[\d\s,]+\.\d{2}\s*$"#, options: .regularExpression) {
            remainder = String(line[..<priceRange.lowerBound]).trimmingCharacters(in: .whitespaces)
        }

        var quantity = 1
        var name = remainder

        if let qtyMatch = remainder.range(of: #"^(\d+)\s*[x×X]\s*"#, options: .regularExpression) {
            quantity = Int(remainder[qtyMatch].filter(\.isNumber)) ?? 1
            name = String(remainder[qtyMatch.upperBound...]).trimmingCharacters(in: .whitespaces)
        } else if let qtyMatch = remainder.range(of: #"^(\d+)[-.\s]+"#, options: .regularExpression) {
            quantity = Int(remainder[qtyMatch].filter(\.isNumber)) ?? 1
            name = String(remainder[qtyMatch.upperBound...]).trimmingCharacters(in: .whitespaces)
        }

        if quantity > 50 {
            return makeItem(name: remainder, quantity: 1, lineTotal: lineTotal, confidence: 0.65)
        }

        name = name.trimmingCharacters(in: CharacterSet(charactersIn: ":.-"))
        guard !name.isEmpty, name.count >= 2 else { return nil }
        return makeItem(name: name, quantity: quantity, lineTotal: lineTotal)
    }

    /// `1 BBQ Potato Chips: $7.00`
    private static func parseColonPriceLine(_ line: String) -> LineItem? {
        guard line.contains(":"), let lineTotal = trailingAmount(line) else { return nil }
        let parts = line.split(separator: ":", maxSplits: 1).map { String($0).trimmingCharacters(in: .whitespaces) }
        guard parts.count == 2 else { return nil }

        var namePart = parts[0]
        var quantity = 1
        if let qtyMatch = namePart.range(of: #"^(\d+)\s+"#, options: .regularExpression) {
            quantity = Int(namePart[qtyMatch].filter(\.isNumber)) ?? 1
            namePart = String(namePart[qtyMatch.upperBound...]).trimmingCharacters(in: .whitespaces)
        }
        guard !namePart.isEmpty else { return nil }
        return makeItem(name: namePart, quantity: quantity, lineTotal: lineTotal)
    }

    private static func makeItem(name: String, quantity: Int, lineTotal: Decimal, confidence: Double = 0.85) -> LineItem {
        let qty = max(quantity, 1)
        let unit = lineTotal / Decimal(qty)
        return LineItem(
            name: name,
            unitPrice: unit,
            quantity: qty,
            lineTotal: lineTotal,
            source: .ocr,
            ocrConfidence: confidence
        )
    }

    // MARK: - Adjustments

    private static func detectAdjustment(_ line: String) -> BillAdjustment? {
        let lower = line.lowercased()
        let type: AdjustmentType?
        if lower.contains("discount") || lower.contains(" off") || lower.contains("loyalty") {
            type = .discount
        } else if lower.contains("service charge") || lower.contains("admin fee") || lower.contains("service fee") {
            type = .serviceCharge
        } else if lower.contains("2 for 1") || lower.contains("bogo") {
            type = .multiBuyDeal
        } else {
            type = nil
        }
        guard let type else { return nil }
        guard let amount = trailingAmount(line) else { return nil }
        return BillAdjustment(
            label: line,
            amount: type == .discount ? -abs(amount) : abs(amount),
            adjustmentType: type,
            handling: .unresolved
        )
    }
}

#if DEBUG
extension ReceiptParserService {
    /// OCR-like text for regression testing against real receipt formats.
    static let fixtureWoolworths = """
    Woolworths Cafe
    Rosebank
    Tel: 011 252 3272
    Eat In
    1 Beef Brg 80.00
    1 Med Plate 75.00
    2 Sprite 330ml @ 19.00 38.00
    1 Ex Chillies 8.00
    1 Still Water500ml 14.00
    2 Espresso Dbl @ 20.00 40.00
    Total 255.00
    """

    /// Simulates Vision OCR splitting name and price onto separate lines.
    static let fixtureWoolworthsSplitOCR = """
    Woolworths Cafe
    Rosebank
    Eat In
    1 Beef Brg 80.00
    1 Med Plate
    75.00
    2 Sprite 330ml @ 19.00
    38.00
    1 Ex Chillies 8.00
    1 Still Water500ml 14.00
    2 Espresso Dbl @ 20.00
    40.00
    Total 255.00
    """

    static let fixtureTackRoom = """
    The Tack Room
    145 Lincoln Road
    Server: Griffin F
    Check #36 Table 59
    1 BBQ Potato Chips $7.00
    1 Diet Coke $3.00
    1 Trillium Fort Point $10.00
    2 Fried Chicken Sandwich $34.00
    1 Famous Duck Grilled Cheese $25.00
    Subtotal $114.00
    Admin Fee (3.00%) $3.42
    Tax $7.11
    Total $124.53
    """

    static let fixtureLaCabana = """
    La Cabana
    La Cabana - Venice
    Server: Emilio
    1 Dos Tacos (Brunch) 18.00
    1 6. Taco y Enchilada (Super Combo) 21.95
    1 Brunch Reg Lime Margarita 12.75
    Subtotal 52.70
    Sales Tax 5.01
    Total 57.71
    """
}
#endif
