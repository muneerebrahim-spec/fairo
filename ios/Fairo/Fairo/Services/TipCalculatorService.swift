import Foundation

enum TipCalculatorService {
    static func tipAmount(for split: Split) -> Decimal {
        switch split.tip.mode {
        case .none:
            return 0
        case .flat:
            return split.tip.flatAmount ?? 0
        case .percentage:
            let pct = split.tip.percentage ?? 0
            let base = split.tip.baseIsTotal ? split.total : split.subtotal
            return MoneyService.round(base * pct / 100, currencyCode: split.currencyCode)
        }
    }

    static func participantAssignedSubtotal(_ split: Split, participantId: UUID) -> Decimal {
        var total: Decimal = 0
        for item in ReconciliationService.activeItems(split) {
            let shares = item.assignedShares.filter { $0.participantId == participantId }
            guard !shares.isEmpty else { continue }
            let count = Decimal(item.assignedShares.count)
            total += item.lineTotal / count
        }
        return MoneyService.round(total, currencyCode: split.currencyCode)
    }

    static func totals(for split: Split) -> [ParticipantTotal] {
        if split.splitMode == .even {
            let count = Decimal(max(split.participants.count, 1))
            let share = MoneyService.round(split.total / count, currencyCode: split.currencyCode)
            return split.participants.map {
                ParticipantTotal(
                    participantId: $0.id,
                    displayName: $0.displayName,
                    itemsTotal: share,
                    taxShare: 0,
                    tipShare: 0,
                    total: share
                )
            }
        }

        if split.splitMode == .percentage {
            let weights = split.participants.map { split.percentageAllocations[$0.id] ?? 0 }
            let shares = MoneyService.distributeWithRemainder(total: split.total, weights: weights)
            return split.participants.enumerated().map { idx, p in
                ParticipantTotal(
                    participantId: p.id,
                    displayName: p.displayName,
                    itemsTotal: shares[idx],
                    taxShare: 0,
                    tipShare: 0,
                    total: shares[idx]
                )
            }
        }

        let assignedSubtotal = split.participants
            .map { participantAssignedSubtotal(split, participantId: $0.id) }
            .reduce(0, +)
        let tipTotal = tipAmount(for: split)
        let overrides = split.tip.perPersonOverrides
        let fixedTip = overrides.values.reduce(0, +)
        let remainingTip = max(0, tipTotal - fixedTip)
        let nonOverride = split.participants.filter { overrides[$0.id] == nil }
        let nonOverrideAssigned = nonOverride
            .map { participantAssignedSubtotal(split, participantId: $0.id) }
            .reduce(0, +)

        return split.participants.map { p in
            let itemsTotal = participantAssignedSubtotal(split, participantId: p.id)
            let taxShare: Decimal = assignedSubtotal > 0
                ? MoneyService.round(split.tax * itemsTotal / assignedSubtotal, currencyCode: split.currencyCode)
                : 0
            let tipShare: Decimal
            if let override = overrides[p.id] {
                tipShare = override
            } else if nonOverrideAssigned > 0 {
                tipShare = MoneyService.round(remainingTip * itemsTotal / nonOverrideAssigned, currencyCode: split.currencyCode)
            } else {
                tipShare = 0
            }
            let total = MoneyService.round(itemsTotal + taxShare + tipShare, currencyCode: split.currencyCode)
            return ParticipantTotal(
                participantId: p.id,
                displayName: p.displayName,
                itemsTotal: itemsTotal,
                taxShare: taxShare,
                tipShare: tipShare,
                total: total
            )
        }
    }

    static func percentageSum(_ split: Split) -> Decimal {
        split.percentageAllocations.values.reduce(0, +)
    }
}
