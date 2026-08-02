export type SplitStatus =
  | 'scanning'
  | 'reviewing'
  | 'assigning'
  | 'reconciling'
  | 'complete'

export type ItemSource = 'ocr' | 'manual'

export type ShareType = 'equalAmongAssignees' | 'explicit'

export type AdjustmentType =
  | 'discount'
  | 'serviceCharge'
  | 'multiBuyDeal'
  | 'other'

export type AdjustmentHandling = 'ownLine' | 'proportional' | 'unresolved'

export type TipMode = 'none' | 'percentage' | 'flat'

export type TipDistribution = 'proportionalToAssigned' | 'evenAcrossAll'

export type SplitMode = 'byItem' | 'even' | 'percentage'

export type CorrectionMode = 'stepThrough' | 'fullListEdit'

export type ReconciliationStatus =
  | { type: 'balanced' }
  | { type: 'leftoverUnassigned'; amount: number }
  | { type: 'overassigned'; amount: number }

export interface AssignedShare {
  id: string
  participantId: string
  shareType: ShareType
  explicitAmount?: number
}

export interface LineItem {
  id: string
  name: string
  unitPrice: number
  quantity: number
  lineTotal: number
  source: ItemSource
  ocrConfidence?: number
  isDisregarded: boolean
  assignedShares: AssignedShare[]
}

export interface BillAdjustment {
  id: string
  label: string
  amount: number
  adjustmentType: AdjustmentType
  handling: AdjustmentHandling
  affectedItemIds: string[]
}

export interface TipConfig {
  mode: TipMode
  percentage?: number
  flatAmount?: number
  baseIsTotal: boolean
  distribution: TipDistribution
  perPersonOverrides: Record<string, number>
}

export interface SplitParticipant {
  id: string
  personOrHouseholdId: string
  displayName: string
  isHousehold: boolean
  avatarColor: string
}

export interface SavedPerson {
  id: string
  name: string
  avatarColor: string
  contactIdentifier?: string
  householdId?: string
}

export interface SavedHousehold {
  id: string
  name: string
  memberIds: string[]
}

export interface Split {
  id: string
  title: string
  date: string
  currencyCode: string
  receiptImages: string[]
  items: LineItem[]
  adjustments: BillAdjustment[]
  subtotal: number
  tax: number
  tip: TipConfig
  total: number
  participants: SplitParticipant[]
  splitMode: SplitMode
  correctionMode: CorrectionMode
  reconciliationStatus: ReconciliationStatus
  savedToHistory: boolean
  status: SplitStatus
  percentageAllocations: Record<string, number>
}

export const AVATAR_COLORS = [
  '#047857',
  '#0D9488',
  '#0891B2',
  '#7C3AED',
  '#DB2777',
  '#D97706',
  '#DC2626',
  '#2563EB',
]

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function createEmptySplit(currencyCode = 'USD'): Split {
  return {
    id: createId(),
    title: 'New Split',
    date: new Date().toISOString(),
    currencyCode,
    receiptImages: [],
    items: [],
    adjustments: [],
    subtotal: 0,
    tax: 0,
    tip: {
      mode: 'none',
      baseIsTotal: false,
      distribution: 'proportionalToAssigned',
      perPersonOverrides: {},
    },
    total: 0,
    participants: [],
    splitMode: 'byItem',
    correctionMode: 'fullListEdit',
    reconciliationStatus: { type: 'balanced' },
    savedToHistory: false,
    status: 'scanning',
    percentageAllocations: {},
  }
}
