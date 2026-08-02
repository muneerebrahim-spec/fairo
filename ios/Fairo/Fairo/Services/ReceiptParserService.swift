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
        let lines = text.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        let merchant = lines.first ?? "Receipt"
        let totalsIndex = lines.firstIndex { isTotalsLine($0) } ?? lines.count
        let itemLines = lines.dropFirst().prefix(max(0, totalsIndex - 1))
        let totalsLines = totalsIndex < lines.count ? lines[totalsIndex...] : []

        var items: [LineItem] = []
        var adjustments: [BillAdjustment] = []

        for line in itemLines {
            if let adj = detectAdjustment(line) {
                adjustments.append(adj)
                continue
            }
            if let item = parseItemLine(line) {
                items.append(item)
            } else {
                items.append(LineItem(
                    name: line,
                    unitPrice: 0,
                    quantity: 1,
                    lineTotal: 0,
                    source: .ocr,
                    ocrConfidence: 0.4
                ))
            }
        }

        var subtotal: Decimal = 0
        var tax: Decimal = 0
        var total: Decimal = 0

        for line in totalsLines {
            let lower = line.lowercased()
            guard let price = trailingPrice(line) else { continue }
            if lower.contains("subtotal") { subtotal = price }
            else if lower.contains("tax") || lower.contains("vat") { tax = price }
            else if lower.contains("total") && !lower.contains("subtotal") { total = price }
        }

        if subtotal == 0 {
            subtotal = items.filter { !$0.isDisregarded }.map(\.lineTotal).reduce(0, +)
        }
        if total == 0 { total = subtotal + tax }

        return ParsedReceipt(
            merchantName: merchant,
            items: items,
            adjustments: adjustments,
            subtotal: MoneyService.round(subtotal, currencyCode: currencyCode),
            tax: MoneyService.round(tax, currencyCode: currencyCode),
            total: MoneyService.round(total, currencyCode: currencyCode),
            currencyCode: currencyCode
        )
    }

    private static func isTotalsLine(_ line: String) -> Bool {
        let lower = line.lowercased()
        return ["subtotal", "tax", "vat", "total", "tip"].contains { lower.contains($0) }
    }

    private static func trailingPrice(_ line: String) -> Decimal? {
        guard let match = line.range(of: #"(\d+[.,]\d{2})\s*$"#, options: .regularExpression) else { return nil }
        let raw = String(line[match]).replacingOccurrences(of: ",", with: ".")
        return Decimal(string: raw.filter { "0123456789.".contains($0) })
    }

    private static func parseItemLine(_ line: String) -> LineItem? {
        guard let price = trailingPrice(line) else { return nil }
        var namePart = line
        if let range = line.range(of: #"(\d+[.,]\d{2})\s*$"#, options: .regularExpression) {
            namePart = String(line[..<range.lowerBound]).trimmingCharacters(in: .whitespaces)
        }
        var quantity = 1
        if let qtyMatch = namePart.range(of: #"^(\d+)\s*[x×]\s*"#, options: .regularExpression) {
            let qtyStr = namePart[qtyMatch].filter(\.isNumber)
            quantity = Int(qtyStr) ?? 1
            namePart = String(namePart[qtyMatch.upperBound...]).trimmingCharacters(in: .whitespaces)
        }
        guard !namePart.isEmpty else { return nil }
        let unit = quantity > 0 ? price / Decimal(quantity) : price
        return LineItem(
            name: namePart,
            unitPrice: unit,
            quantity: quantity,
            lineTotal: price,
            source: .ocr,
            ocrConfidence: 0.85
        )
    }

    private static func detectAdjustment(_ line: String) -> BillAdjustment? {
        let lower = line.lowercased()
        let type: AdjustmentType?
        if lower.contains("discount") || lower.contains("off") || lower.contains("%") { type = .discount }
        else if lower.contains("service") { type = .serviceCharge }
        else if lower.contains("2 for 1") || lower.contains("bogo") { type = .multiBuyDeal }
        else { type = nil }
        guard let type else { return nil }
        let amount = trailingPrice(line) ?? 0
        return BillAdjustment(
            label: line,
            amount: type == .discount ? -abs(amount) : abs(amount),
            adjustmentType: type,
            handling: .unresolved
        )
    }
}
