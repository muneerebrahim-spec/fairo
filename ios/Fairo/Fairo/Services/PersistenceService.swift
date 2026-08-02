import Foundation
import SwiftData
import UIKit

@MainActor
enum PersistenceService {
    static func loadHistory(context: ModelContext) -> [Split] {
        let descriptor = FetchDescriptor<PersistedSplitEntity>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        guard let entities = try? context.fetch(descriptor) else { return [] }
        return entities.compactMap { decodeSplit(from: $0) }
    }

    static func loadSavedPeople(context: ModelContext) -> [SavedPerson] {
        let descriptor = FetchDescriptor<SavedPersonEntity>(
            sortBy: [SortDescriptor(\.name, order: .forward)]
        )
        guard let entities = try? context.fetch(descriptor) else { return [] }
        return entities.map { SavedPerson(entity: $0) }
    }

    static func saveSplit(_ split: Split, context: ModelContext) {
        guard split.savedToHistory else { return }
        guard let data = try? JSONEncoder().encode(split) else { return }

        let id = split.id
        let descriptor = FetchDescriptor<PersistedSplitEntity>(
            predicate: #Predicate { $0.id == id }
        )
        if let existing = try? context.fetch(descriptor).first {
            existing.payload = data
            existing.savedToHistory = true
            existing.updatedAt = .now
        } else {
            context.insert(PersistedSplitEntity(
                id: id,
                payload: data,
                savedToHistory: true
            ))
        }
        try? context.save()
    }

    static func upsertSavedPerson(
        name: String,
        avatarColorHex: String,
        personId: UUID,
        context: ModelContext
    ) {
        let descriptor = FetchDescriptor<SavedPersonEntity>(
            predicate: #Predicate { $0.id == personId }
        )
        if let existing = try? context.fetch(descriptor).first {
            existing.name = name
            existing.avatarColorHex = avatarColorHex
        } else {
            context.insert(SavedPersonEntity(
                id: personId,
                name: name,
                avatarColorHex: avatarColorHex
            ))
        }
        try? context.save()
    }

    static func decodeSplit(from entity: PersistedSplitEntity) -> Split? {
        try? JSONDecoder().decode(Split.self, from: entity.payload)
    }
}

extension Split {
    mutating func apply(parsed: ParsedReceipt, receiptImages: [Data] = []) {
        title = parsed.merchantName
        items = parsed.items
        adjustments = parsed.adjustments
        subtotal = parsed.subtotal
        tax = parsed.tax
        total = parsed.total
        currencyCode = parsed.currencyCode
        self.receiptImages = receiptImages
        status = .reviewing
    }
}

enum ReceiptImageCodec {
    static func encode(_ images: [UIImage]) -> [Data] {
        images.compactMap { $0.jpegData(compressionQuality: 0.85) }
    }
}
