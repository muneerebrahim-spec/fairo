import type {
  BillAdjustment,
  LineItem,
  ReconciliationStatus,
  Split,
} from '../models/types'
import { createId } from '../models/types'
import { roundMoney } from './money'

const TOLERANCE = 0.01

export function activeItems(items: LineItem[]): LineItem[] {
  return items.filter((i) => !i.isDisregarded)
}

export function recalculateSubtotal(split: Split): number {
  return roundMoney(
    activeItems(split.items).reduce((s, i) => s + i.lineTotal, 0),
    split.currencyCode,
  )
}

export function ownLineAdjustments(
  adjustments: BillAdjustment[],
): BillAdjustment[] {
  return adjustments.filter((a) => a.handling === 'ownLine')
}

export function approvedAssignmentTotal(split: Split): number {
  const itemTotal = activeItems(split.items).reduce((s, i) => s + i.lineTotal, 0)
  const ownLineTotal = ownLineAdjustments(split.adjustments).reduce(
    (s, a) => s + a.amount,
    0,
  )
  return roundMoney(itemTotal + ownLineTotal, split.currencyCode)
}

export function assignedTotal(split: Split): number {
  const itemAssigned = activeItems(split.items)
    .filter((i) => i.assignedShares.length > 0)
    .reduce((s, i) => s + i.lineTotal, 0)

  const adjustmentAssigned = ownLineAdjustments(split.adjustments)
    .filter((a) =>
      split.items.some(
        (i) =>
          i.name === a.label &&
          !i.isDisregarded &&
          i.assignedShares.length > 0,
      ),
    )
    .reduce((s, a) => s + a.amount, 0)

  return roundMoney(itemAssigned + adjustmentAssigned, split.currencyCode)
}

export function unassignedItems(split: Split): LineItem[] {
  return activeItems(split.items).filter((i) => i.assignedShares.length === 0)
}

export function reconcile(split: Split): ReconciliationStatus {
  const approved = approvedAssignmentTotal(split)
  const assigned = assignedTotal(split)
  const delta = roundMoney(approved - assigned, split.currencyCode)

  if (Math.abs(delta) <= TOLERANCE) return { type: 'balanced' }
  if (delta > 0) return { type: 'leftoverUnassigned', amount: delta }
  return { type: 'overassigned', amount: Math.abs(delta) }
}

export function assignItemEvenly(
  split: Split,
  itemId: string,
  participantIds: string[],
): Split {
  const shares = participantIds.map((pid) => ({
    id: createId(),
    participantId: pid,
    shareType: 'equalAmongAssignees' as const,
  }))

  return {
    ...split,
    items: split.items.map((item) =>
      item.id === itemId ? { ...item, assignedShares: shares } : item,
    ),
  }
}

export function toggleItemAssignment(
  split: Split,
  itemId: string,
  participantId: string,
): Split {
  return {
    ...split,
    items: split.items.map((item) => {
      if (item.id !== itemId) return item
      const exists = item.assignedShares.some(
        (s) => s.participantId === participantId,
      )
      if (exists) {
        return {
          ...item,
          assignedShares: item.assignedShares.filter(
            (s) => s.participantId !== participantId,
          ),
        }
      }
      return {
        ...item,
        assignedShares: [
          ...item.assignedShares,
          {
            id: createId(),
            participantId,
            shareType: 'equalAmongAssignees',
          },
        ],
      }
    }),
  }
}

export function assignUnassignedEvenly(split: Split): Split {
  const participantIds = split.participants.map((p) => p.id)
  if (participantIds.length === 0) return split

  let updated = split
  for (const item of unassignedItems(split)) {
    updated = assignItemEvenly(updated, item.id, participantIds)
  }
  return updated
}

export function adjustmentToLineItem(adj: BillAdjustment): LineItem {
  return {
    id: createId(),
    name: adj.label,
    unitPrice: adj.amount,
    quantity: 1,
    lineTotal: adj.amount,
    source: 'manual',
    isDisregarded: false,
    assignedShares: [],
  }
}
