import Foundation
import SwiftUI
import UIKit

@MainActor
@Observable
final class SplitFlowViewModel {
    var activeSplit: Split?
    var history: [Split] = []
    var selectedItemId: UUID?
    var stepThroughIndex = 0

    private let storageKey = "fairo.history"

    init() {
        loadHistory()
    }

    func startNewSplit() {
        activeSplit = Split.empty()
        activeSplit?.status = .scanning
        selectedItemId = nil
        stepThroughIndex = 0
    }

    func processSampleReceipt() {
        guard var split = activeSplit else { return }
        let parsed = ReceiptParserService.parse(
            text: ReceiptParserService.sampleText,
            currencyCode: split.currencyCode
        )
        split.title = parsed.merchantName
        split.items = parsed.items
        split.adjustments = parsed.adjustments
        split.subtotal = parsed.subtotal
        split.tax = parsed.tax
        split.total = parsed.total
        split.status = .reviewing
        activeSplit = split
        stepThroughIndex = 0
    }

    func updateSplit(_ transform: (inout Split) -> Void) {
        guard var split = activeSplit else { return }
        transform(&split)
        split.subtotal = ReconciliationService.recalculateSubtotal(split)
        if split.total == 0 || split.status == .reviewing {
            split.total = split.subtotal + split.tax
        }
        activeSplit = split
    }

    func resolveAdjustment(id: UUID, handling: AdjustmentHandling) {
        updateSplit { split in
            guard let idx = split.adjustments.firstIndex(where: { $0.id == id }) else { return }
            split.adjustments[idx].handling = handling
            if handling == .ownLine {
                let adj = split.adjustments[idx]
                split.items.append(LineItem(
                    name: adj.label,
                    unitPrice: adj.amount,
                    quantity: 1,
                    lineTotal: adj.amount,
                    source: .manual
                ))
            }
        }
    }

    func nextUnresolvedAdjustment() -> BillAdjustment? {
        activeSplit?.adjustments.first { $0.handling == .unresolved }
    }

    func addParticipant(name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let colorIndex = activeSplit?.participants.count ?? 0
        let color = AvatarPalette.colors[colorIndex % AvatarPalette.colors.count]
        updateSplit { split in
            split.participants.append(SplitParticipant(
                personOrHouseholdId: UUID(),
                displayName: trimmed,
                avatarColorHex: color
            ))
        }
    }

    func toggleAssignment(participantId: UUID) {
        guard let itemId = selectedItemId, var split = activeSplit else { return }
        split = ReconciliationService.toggleAssignment(
            split: split,
            itemId: itemId,
            participantId: participantId
        )
        split.reconciliationStatus = ReconciliationService.reconcile(split)
        activeSplit = split
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    func runReconciliation() {
        guard var split = activeSplit else { return }
        split.reconciliationStatus = ReconciliationService.reconcile(split)
        split.status = .reconciling
        activeSplit = split
    }

    func resolveEvenly() {
        guard var split = activeSplit else { return }
        split = ReconciliationService.assignAllUnassignedEvenly(split)
        split.reconciliationStatus = ReconciliationService.reconcile(split)
        activeSplit = split
        if case .balanced = split.reconciliationStatus {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }

    func saveToHistory() {
        guard var split = activeSplit else { return }
        split.savedToHistory = true
        split.status = .complete
        history.insert(split, at: 0)
        activeSplit = nil
        persistHistory()
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    func discardSplit() {
        activeSplit = nil
    }

    private func loadHistory() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([Split].self, from: data) else { return }
        history = decoded
    }

    private func persistHistory() {
        guard let data = try? JSONEncoder().encode(history) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}
