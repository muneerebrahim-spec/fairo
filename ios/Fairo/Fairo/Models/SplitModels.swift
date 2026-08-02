import Foundation

// MARK: - Enums

enum SplitStatus: String, Codable {
    case scanning, reviewing, assigning, reconciling, complete
}

enum ItemSource: String, Codable {
    case ocr, manual
}

enum ShareType: String, Codable {
    case equalAmongAssignees, explicit
}

enum AdjustmentType: String, Codable {
    case discount, serviceCharge, multiBuyDeal, other
}

enum AdjustmentHandling: String, Codable {
    case ownLine, proportional, unresolved
}

enum TipMode: String, Codable {
    case none, percentage, flat
}

enum TipDistribution: String, Codable {
    case proportionalToAssigned, evenAcrossAll
}

enum SplitMode: String, Codable {
    case byItem, even, percentage
}

enum CorrectionMode: String, Codable {
    case stepThrough, fullListEdit
}

enum ReconciliationStatus: Codable, Equatable, Hashable {
    case balanced
    case leftoverUnassigned(amount: Decimal)
    case overassigned(amount: Decimal)
}

// MARK: - Models

struct AssignedShare: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var participantId: UUID
    var shareType: ShareType = .equalAmongAssignees
    var explicitAmount: Decimal?
}

struct LineItem: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var name: String
    var unitPrice: Decimal
    var quantity: Int
    var lineTotal: Decimal
    var source: ItemSource
    var ocrConfidence: Double?
    var isDisregarded: Bool = false
    var assignedShares: [AssignedShare] = []
}

struct BillAdjustment: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var label: String
    var amount: Decimal
    var adjustmentType: AdjustmentType
    var handling: AdjustmentHandling
    var affectedItemIds: [UUID] = []
}

struct TipConfig: Codable, Hashable {
    var mode: TipMode = .none
    var percentage: Decimal?
    var flatAmount: Decimal?
    var baseIsTotal: Bool = false
    var distribution: TipDistribution = .proportionalToAssigned
    var perPersonOverrides: [UUID: Decimal] = [:]
}

struct SplitParticipant: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var personOrHouseholdId: UUID
    var displayName: String
    var isHousehold: Bool = false
    var avatarColorHex: String
}

struct Split: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var title: String
    var date: Date = .now
    var currencyCode: String
    var receiptImages: [Data] = []
    var items: [LineItem] = []
    var adjustments: [BillAdjustment] = []
    var subtotal: Decimal = 0
    var tax: Decimal = 0
    var tip: TipConfig = TipConfig()
    var total: Decimal = 0
    var participants: [SplitParticipant] = []
    var splitMode: SplitMode = .byItem
    var correctionMode: CorrectionMode = .fullListEdit
    var reconciliationStatus: ReconciliationStatus = .balanced
    var savedToHistory: Bool = false
    var status: SplitStatus = .scanning
    var percentageAllocations: [UUID: Decimal] = [:]

    static func empty(currencyCode: String = Locale.current.currency?.identifier ?? "USD") -> Split {
        Split(title: "New Split", currencyCode: currencyCode)
    }
}

struct ParticipantTotal: Identifiable, Hashable {
    var id: UUID { participantId }
    var participantId: UUID
    var displayName: String
    var itemsTotal: Decimal
    var taxShare: Decimal
    var tipShare: Decimal
    var total: Decimal
}

enum AvatarPalette {
    static let colors = [
        "#047857", "#0D9488", "#0891B2", "#7C3AED",
        "#DB2777", "#D97706", "#DC2626", "#2563EB",
    ]
}
