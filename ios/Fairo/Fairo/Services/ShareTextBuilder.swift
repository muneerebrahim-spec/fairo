import Foundation

enum ShareTextBuilder {
    static func build(for split: Split) -> String {
        let date = split.date.formatted(date: .abbreviated, time: .omitted)
        let tip = TipCalculatorService.tipAmount(for: split)
        let participantTotals = TipCalculatorService.totals(for: split)
        var lines: [String] = ["\(split.title) — \(date)", "", "Items:"]

        for item in ReconciliationService.activeItems(split) {
            let names = item.assignedShares.compactMap { share in
                split.participants.first { $0.id == share.participantId }?.displayName
            }.joined(separator: ", ")
            lines.append("• \(item.name) x\(item.quantity) — \(MoneyService.format(item.lineTotal, currencyCode: split.currencyCode)) → \(names.isEmpty ? "Unassigned" : names)")
        }

        for adj in split.adjustments where adj.handling == .ownLine {
            lines.append("• \(adj.label) — \(MoneyService.format(adj.amount, currencyCode: split.currencyCode))")
        }

        lines += [
            "",
            "Subtotal: \(MoneyService.format(split.subtotal, currencyCode: split.currencyCode))",
            "Tax: \(MoneyService.format(split.tax, currencyCode: split.currencyCode))",
            "Tip: \(MoneyService.format(tip, currencyCode: split.currencyCode))",
            "Total: \(MoneyService.format(split.total + tip, currencyCode: split.currencyCode))",
            "", "—", "",
        ]

        for pt in participantTotals {
            lines.append("\(pt.displayName): \(MoneyService.format(pt.total, currencyCode: split.currencyCode)) (items: \(MoneyService.format(pt.itemsTotal, currencyCode: split.currencyCode)) + tax: \(MoneyService.format(pt.taxShare, currencyCode: split.currencyCode)) + tip: \(MoneyService.format(pt.tipShare, currencyCode: split.currencyCode)))")
        }

        return lines.joined(separator: "\n")
    }
}
