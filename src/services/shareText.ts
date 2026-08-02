import type { Split } from '../models/types'
import { formatMoney } from './money'
import { calculateTipAmount, calculateParticipantTotals } from './tipCalculator'
import { activeItems } from './reconciliation'

export function buildShareText(split: Split): string {
  const date = new Date(split.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const { currencyCode } = split
  const tipAmount = calculateTipAmount(split)
  const participantTotals = calculateParticipantTotals(split)

  const lines: string[] = [`${split.title} — ${date}`, '', 'Items:']

  for (const item of activeItems(split.items)) {
    const assignees = item.assignedShares
      .map(
        (s) =>
          split.participants.find((p) => p.id === s.participantId)?.displayName,
      )
      .filter(Boolean)
      .join(', ')
    lines.push(
      `• ${item.name} x${item.quantity} — ${formatMoney(item.lineTotal, currencyCode)} → ${assignees || 'Unassigned'}`,
    )
  }

  for (const adj of split.adjustments.filter((a) => a.handling === 'ownLine')) {
    lines.push(
      `• ${adj.label} — ${formatMoney(adj.amount, currencyCode)}`,
    )
  }

  lines.push('')
  lines.push(`Subtotal: ${formatMoney(split.subtotal, currencyCode)}`)
  lines.push(`Tax: ${formatMoney(split.tax, currencyCode)}`)

  const tipLabel =
    split.tip.mode === 'percentage'
      ? `${split.tip.percentage}%`
      : split.tip.mode === 'flat'
        ? 'flat'
        : 'none'
  lines.push(
    `Tip: ${formatMoney(tipAmount, currencyCode)} (${tipLabel})`,
  )
  lines.push(`Total: ${formatMoney(split.total, currencyCode)}`)
  lines.push('', '—', '')

  for (const pt of participantTotals) {
    lines.push(
      `${pt.displayName}: ${formatMoney(pt.total, currencyCode)} (items: ${formatMoney(pt.itemsTotal, currencyCode)} + tax: ${formatMoney(pt.taxShare, currencyCode)} + tip: ${formatMoney(pt.tipShare, currencyCode)})`,
    )
  }

  return lines.join('\n')
}
