import { create } from 'zustand'
import type {
  CorrectionMode,
  SavedHousehold,
  SavedPerson,
  Split,
  SplitMode,
} from '../models/types'
import { createEmptySplit, createId } from '../models/types'
import {
  assignUnassignedEvenly,
  recalculateSubtotal,
  reconcile,
} from '../services/reconciliation'
import { parseReceiptText } from '../services/receiptParser'
import {
  deleteSplitFromHistory,
  loadHistory,
  loadSavedHouseholds,
  loadSavedPeople,
  saveSavedHouseholds,
  saveSavedPeople,
  saveSplitToHistory,
} from '../services/storage'

interface SplitStore {
  activeSplit: Split | null
  history: Split[]
  savedPeople: SavedPerson[]
  savedHouseholds: SavedHousehold[]
  stepThroughIndex: number
  pendingAdjustmentIndex: number
  selectedItemId: string | null
  init: () => Promise<void>
  startNewSplit: () => void
  updateSplit: (patch: Partial<Split>) => void
  setActiveSplit: (split: Split | null) => void
  processReceiptText: (text: string) => void
  addReceiptImage: (uri: string) => void
  setCorrectionMode: (mode: CorrectionMode) => void
  setSplitMode: (mode: SplitMode) => void
  resolveAdjustment: (
    adjustmentId: string,
    handling: 'ownLine' | 'proportional',
  ) => void
  runReconciliation: () => Split
  resolveReconciliationEvenly: () => void
  saveHistory: () => Promise<void>
  discardSplit: () => void
  setStepThroughIndex: (index: number) => void
  setPendingAdjustmentIndex: (index: number) => void
  setSelectedItemId: (id: string | null) => void
  upsertSavedPerson: (person: SavedPerson) => Promise<void>
  upsertSavedHousehold: (household: SavedHousehold) => Promise<void>
}

export const useSplitStore = create<SplitStore>((set, get) => ({
  activeSplit: null,
  history: [],
  savedPeople: [],
  savedHouseholds: [],
  stepThroughIndex: 0,
  pendingAdjustmentIndex: 0,
  selectedItemId: null,

  init: async () => {
    const [history, savedPeople, savedHouseholds] = await Promise.all([
      loadHistory(),
      loadSavedPeople(),
      loadSavedHouseholds(),
    ])
    set({ history, savedPeople, savedHouseholds })
  },

  startNewSplit: () => {
    set({
      activeSplit: { ...createEmptySplit(), status: 'scanning' },
      stepThroughIndex: 0,
      pendingAdjustmentIndex: 0,
      selectedItemId: null,
    })
  },

  updateSplit: (patch) => {
    const current = get().activeSplit
    if (!current) return
    const next = { ...current, ...patch }
    if (patch.items || patch.adjustments) {
      next.subtotal = recalculateSubtotal(next)
      if (!patch.total) {
        next.total = next.subtotal + next.tax
      }
    }
    set({ activeSplit: next })
  },

  setActiveSplit: (split) => set({ activeSplit: split }),

  processReceiptText: (text) => {
    const current = get().activeSplit
    if (!current) return
    const parsed = parseReceiptText(text, current.currencyCode)
    set({
      activeSplit: {
        ...current,
        title: parsed.merchantName,
        items: parsed.items,
        adjustments: parsed.adjustments,
        subtotal: parsed.subtotal,
        tax: parsed.tax,
        total: parsed.total,
        currencyCode: parsed.currencyCode,
        status: 'reviewing',
      },
      stepThroughIndex: 0,
      pendingAdjustmentIndex: 0,
    })
  },

  addReceiptImage: (uri) => {
    const current = get().activeSplit
    if (!current) return
    set({
      activeSplit: {
        ...current,
        receiptImages: [...current.receiptImages, uri],
      },
    })
  },

  setCorrectionMode: (mode) => {
    get().updateSplit({ correctionMode: mode })
  },

  setSplitMode: (mode) => {
    get().updateSplit({ splitMode: mode })
  },

  resolveAdjustment: (adjustmentId, handling) => {
    const current = get().activeSplit
    if (!current) return
    const adjustments = current.adjustments.map((a) =>
      a.id === adjustmentId ? { ...a, handling } : a,
    )
    let items = current.items
    if (handling === 'ownLine') {
      const adj = adjustments.find((a) => a.id === adjustmentId)
      if (adj) {
        items = [
          ...items,
          {
            id: createId(),
            name: adj.label,
            unitPrice: adj.amount,
            quantity: 1,
            lineTotal: adj.amount,
            source: 'manual' as const,
            isDisregarded: false,
            assignedShares: [],
          },
        ]
      }
    }
    get().updateSplit({ adjustments, items })
  },

  runReconciliation: () => {
    const current = get().activeSplit!
    const status = reconcile(current)
    const next = { ...current, reconciliationStatus: status }
    set({ activeSplit: next })
    return next
  },

  resolveReconciliationEvenly: () => {
    const current = get().activeSplit
    if (!current) return
    const updated = assignUnassignedEvenly(current)
    const status = reconcile(updated)
    set({
      activeSplit: { ...updated, reconciliationStatus: status },
    })
  },

  saveHistory: async () => {
    const current = get().activeSplit
    if (!current) return
    const saved = {
      ...current,
      savedToHistory: true,
      status: 'complete' as const,
    }
    await saveSplitToHistory(saved)
    const history = await loadHistory()
    set({ history, activeSplit: null })
  },

  discardSplit: () => {
    set({ activeSplit: null })
  },

  setStepThroughIndex: (index) => set({ stepThroughIndex: index }),
  setPendingAdjustmentIndex: (index) => set({ pendingAdjustmentIndex: index }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),

  upsertSavedPerson: async (person) => {
    const people = get().savedPeople
    const next = [...people.filter((p) => p.id !== person.id), person]
    await saveSavedPeople(next)
    set({ savedPeople: next })
  },

  upsertSavedHousehold: async (household) => {
    const households = get().savedHouseholds
    const next = [
      ...households.filter((h) => h.id !== household.id),
      household,
    ]
    await saveSavedHouseholds(next)
    set({ savedHouseholds: next })
  },
}))

export { deleteSplitFromHistory, loadHistory }
