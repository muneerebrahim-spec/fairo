import Foundation
import SwiftData

@Model
final class SavedPersonEntity {
    @Attribute(.unique) var id: UUID
    var name: String
    var avatarColorHex: String
    var createdAt: Date

    init(id: UUID = UUID(), name: String, avatarColorHex: String, createdAt: Date = .now) {
        self.id = id
        self.name = name
        self.avatarColorHex = avatarColorHex
        self.createdAt = createdAt
    }
}

@Model
final class PersistedSplitEntity {
    @Attribute(.unique) var id: UUID
    var payload: Data
    var savedToHistory: Bool
    var updatedAt: Date

    init(id: UUID, payload: Data, savedToHistory: Bool, updatedAt: Date = .now) {
        self.id = id
        self.payload = payload
        self.savedToHistory = savedToHistory
        self.updatedAt = updatedAt
    }
}

struct SavedPerson: Identifiable, Hashable {
    let id: UUID
    let name: String
    let avatarColorHex: String

    init(entity: SavedPersonEntity) {
        id = entity.id
        name = entity.name
        avatarColorHex = entity.avatarColorHex
    }
}
