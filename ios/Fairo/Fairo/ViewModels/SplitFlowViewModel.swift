import Foundation
import SwiftData
import SwiftUI
import UIKit

@MainActor
@Observable
final class SplitFlowViewModel {
    var activeSplit: Split?
    var history: [Split] = []
    var savedPeople: [SavedPerson] = []
    var selectedItemId: UUID?
    var stepThroughIndex = 0
    var isProcessingReceipt = false
    var scanError: String?

    private var modelContext: ModelContext?
    private let legacyStorageKey = "fairo.history"
    private var didMigrateLegacyHistory = false

    func configure(context: ModelContext) {
        guard modelContext == nil else { return }
        modelContext = context
        reloadFromStore()
    }

    func reloadFromStore() {
        guard let context = modelContext else { return }
        migrateLegacyHistoryIfNeeded(context: context)
        history = PersistenceService.loadHistory(context: context)
        savedPeople = PersistenceService.loadSavedPeople(context: context)
    }

    func startNewSplit() {
        activeSplit = Split.empty(currencyCode: AppSettings.preferredCurrencyCode)
        activeSplit?.status = .scanning
        selectedItemId = nil
        stepThroughIndex = 0
        scanError = nil
    }

    func processSampleReceipt() {
        guard var split = activeSplit else { return }
        let parsed = ReceiptParserService.parse(
            text: ReceiptParserService.sampleText,
            currencyCode: split.currencyCode
        )
        split.apply(parsed: parsed)
        activeSplit = split
        stepThroughIndex = 0
    }

    func processScannedImages(_ images: [UIImage]) async {
        guard var split = activeSplit else { return }
        isProcessingReceipt = true
        scanError = nil
        defer { isProcessingReceipt = false }

        do {
            let text = try await VisionOCRService.recognizeText(in: images)
            let parsed = ReceiptParserService.parse(text: text, currencyCode: split.currencyCode)
            let encodedImages = ReceiptImageCodec.encode(images)
            split.apply(parsed: parsed, receiptImages: encodedImages)
            activeSplit = split
            stepThroughIndex = 0
        } catch {
            scanError = error.localizedDescription
        }
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
        let personId = UUID()
        updateSplit { split in
            split.participants.append(SplitParticipant(
                personOrHouseholdId: personId,
                displayName: trimmed,
                avatarColorHex: color
            ))
        }
        persistSavedPerson(id: personId, name: trimmed, colorHex: color)
    }

    func addParticipant(from saved: SavedPerson) {
        guard let split = activeSplit else { return }
        guard !split.participants.contains(where: { $0.personOrHouseholdId == saved.id }) else { return }
        updateSplit { split in
            split.participants.append(SplitParticipant(
                personOrHouseholdId: saved.id,
                displayName: saved.name,
                avatarColorHex: saved.avatarColorHex
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
        guard var split = activeSplit, let context = modelContext else { return }
        split.savedToHistory = true
        split.status = .complete
        PersistenceService.saveSplit(split, context: context)
        history.insert(split, at: 0)
        activeSplit = nil
        reloadFromStore()
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    func discardSplit() {
        activeSplit = nil
    }

    private func persistSavedPerson(id: UUID, name: String, colorHex: String) {
        guard let context = modelContext else { return }
        PersistenceService.upsertSavedPerson(
            name: name,
            avatarColorHex: colorHex,
            personId: id,
            context: context
        )
        savedPeople = PersistenceService.loadSavedPeople(context: context)
    }

    private func migrateLegacyHistoryIfNeeded(context: ModelContext) {
        guard !didMigrateLegacyHistory else { return }
        didMigrateLegacyHistory = true

        let existing = PersistenceService.loadHistory(context: context)
        guard existing.isEmpty,
              let data = UserDefaults.standard.data(forKey: legacyStorageKey),
              let decoded = try? JSONDecoder().decode([Split].self, from: data) else { return }

        for split in decoded where split.savedToHistory {
            PersistenceService.saveSplit(split, context: context)
        }
        UserDefaults.standard.removeObject(forKey: legacyStorageKey)
    }
}
