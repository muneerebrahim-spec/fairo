import Foundation

enum ReconciliationService {
    static let tolerance: Decimal = 0.01

    static func activeItems(_ split: Split) -> [LineItem] {
        split.items.filter { !$0.isDisregarded }
    }

    static func recalculateSubtotal(_ split: Split) -> Decimal {
        MoneyService.round(
            activeItems(split).map(\.lineTotal).reduce(0, +),
            currencyCode: split.currencyCode
        )
    }

    static func approvedTotal(_ split: Split) -> Decimal {
        let items = activeItems(split).map(\.lineTotal).reduce(0, +)
        let ownLine = split.adjustments
            .filter { $0.handling == .ownLine }
            .map(\.amount)
            .reduce(0, +)
        return MoneyService.round(items + ownLine, currencyCode: split.currencyCode)
    }

    static func assignedTotal(_ split: Split) -> Decimal {
        let assigned = activeItems(split)
            .filter { !$0.assignedShares.isEmpty }
            .map(\.lineTotal)
            .reduce(0, +)
        return MoneyService.round(assigned, currencyCode: split.currencyCode)
    }

    static func unassignedItems(_ split: Split) -> [LineItem] {
        activeItems(split).filter { $0.assignedShares.isEmpty }
    }

    static func reconcile(_ split: Split) -> ReconciliationStatus {
        let delta = approvedTotal(split) - assignedTotal(split)
        if abs(delta) <= tolerance { return .balanced }
        if delta > 0 { return .leftoverUnassigned(amount: delta) }
        return .overassigned(amount: abs(delta))
    }

    static func toggleAssignment(split: Split, itemId: UUID, participantId: UUID) -> Split {
        var updated = split
        guard let idx = updated.items.firstIndex(where: { $0.id == itemId }) else { return split }
        if let sIdx = updated.items[idx].assignedShares.firstIndex(where: { $0.participantId == participantId }) {
            updated.items[idx].assignedShares.remove(at: sIdx)
        } else {
            updated.items[idx].assignedShares.append(
                AssignedShare(participantId: participantId, shareType: .equalAmongAssignees)
            )
        }
        return updated
    }

    static func assignEvenly(split: Split, itemId: UUID, participantIds: [UUID]) -> Split {
        var updated = split
        guard let idx = updated.items.firstIndex(where: { $0.id == itemId }) else { return split }
        updated.items[idx].assignedShares = participantIds.map {
            AssignedShare(participantId: $0, shareType: .equalAmongAssignees)
        }
        return updated
    }

    static func assignAllUnassignedEvenly(_ split: Split) -> Split {
        var updated = split
        let ids = split.participants.map(\.id)
        for item in unassignedItems(split) {
            updated = assignEvenly(split: updated, itemId: item.id, participantIds: ids)
        }
        return updated
    }
}
