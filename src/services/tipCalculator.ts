import type { Split, SplitParticipant } from '../models/types'
import { activeItems } from './reconciliation'
import {
  distributeWithRemainder,
  fromMinor,
  roundMoney,
  sum,
  toMinor,
} from './money'

export interface ParticipantTotal {
  participantId: string
  displayName: string
  itemsTotal: number
  taxShare: number
  tipShare: number
  total: number
  roundingAdjustment: number
}

function participantAssignedSubtotal(
  split: Split,
  participantId: string,
): number {
  let total = 0
  for (const item of activeItems(split.items)) {
    const shares = item.assignedShares.filter(
      (s) => s.participantId === participantId,
    )
    if (shares.length === 0) continue
    const assigneeCount = item.assignedShares.length
    total += item.lineTotal / assigneeCount
  }
  return roundMoney(total, split.currencyCode)
}

function totalAssignedSubtotal(split: Split): number {
  return roundMoney(
    split.participants.reduce(
      (s, p) => s + participantAssignedSubtotal(split, p.id),
      0,
    ),
    split.currencyCode,
  )
}

export function calculateTipAmount(split: Split): number {
  const { tip } = split
  if (tip.mode === 'none') return 0
  if (tip.mode === 'flat') return tip.flatAmount ?? 0

  const pct = tip.percentage ?? 0
  const tipBase = tip.baseIsTotal ? split.total : split.subtotal
  return roundMoney((tipBase * pct) / 100, split.currencyCode)
}

export function calculateParticipantTotals(split: Split): ParticipantTotal[] {
  const { participants, currencyCode } = split

  if (split.splitMode === 'even') {
    const count = participants.length || 1
    const totalMinor = toMinor(split.total, currencyCode)
    const shares = distributeWithRemainder(
      totalMinor,
      participants.map(() => 1),
    )
    return participants.map((p, i) => ({
      participantId: p.id,
      displayName: p.displayName,
      itemsTotal: fromMinor(shares[i], currencyCode),
      taxShare: 0,
      tipShare: 0,
      total: fromMinor(shares[i], currencyCode),
      roundingAdjustment: 0,
    }))
  }

  if (split.splitMode === 'percentage') {
    const totalMinor = toMinor(split.total, currencyCode)
    const weights = participants.map(
      (p) => split.percentageAllocations[p.id] ?? 0,
    )
    const shares = distributeWithRemainder(totalMinor, weights)
    return participants.map((p, i) => ({
      participantId: p.id,
      displayName: p.displayName,
      itemsTotal: fromMinor(shares[i], currencyCode),
      taxShare: 0,
      tipShare: 0,
      total: fromMinor(shares[i], currencyCode),
      roundingAdjustment: 0,
    }))
  }

  const assignedSubtotal = totalAssignedSubtotal(split)
  const tipAmount = calculateTipAmount(split)
  const taxAmount = split.tax

  const overriddenIds = new Set(Object.keys(split.tip.perPersonOverrides))
  const fixedTipTotal = sum(
    Object.values(split.tip.perPersonOverrides).map((v) => v ?? 0),
  )
  const remainingTip = Math.max(0, tipAmount - fixedTipTotal)

  const nonOverrideParticipants = participants.filter(
    (p) => !overriddenIds.has(p.id),
  )
  const nonOverrideAssigned = nonOverrideParticipants.reduce(
    (s, p) => s + participantAssignedSubtotal(split, p.id),
    0,
  )

  return participants.map((p) => {
    const itemsTotal = participantAssignedSubtotal(split, p.id)
    const taxShare =
      assignedSubtotal > 0
        ? roundMoney(
            (itemsTotal / assignedSubtotal) * taxAmount,
            currencyCode,
          )
        : 0

    let tipShare = 0
    if (overriddenIds.has(p.id)) {
      tipShare = split.tip.perPersonOverrides[p.id] ?? 0
    } else if (nonOverrideAssigned > 0) {
      tipShare = roundMoney(
        (itemsTotal / nonOverrideAssigned) * remainingTip,
        currencyCode,
      )
    } else if (split.tip.distribution === 'evenAcrossAll') {
      tipShare = roundMoney(
        tipAmount / (participants.length || 1),
        currencyCode,
      )
    }

    const total = roundMoney(itemsTotal + taxShare + tipShare, currencyCode)
    return {
      participantId: p.id,
      displayName: p.displayName,
      itemsTotal,
      taxShare,
      tipShare,
      total,
      roundingAdjustment: 0,
    }
  })
}

export function percentageSum(split: Split): number {
  return roundMoney(
    sum(Object.values(split.percentageAllocations)),
    split.currencyCode,
  )
}

export function participantNamesForItem(
  split: Split,
  itemId: string,
): string[] {
  const item = split.items.find((i) => i.id === itemId)
  if (!item) return []
  return item.assignedShares
    .map(
      (s) =>
        split.participants.find((p) => p.id === s.participantId)?.displayName,
    )
    .filter(Boolean) as string[]
}

export function getParticipant(
  split: Split,
  id: string,
): SplitParticipant | undefined {
  return split.participants.find((p) => p.id === id)
}
