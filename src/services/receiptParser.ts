import type {
  AdjustmentType,
  BillAdjustment,
  LineItem,
} from '../models/types'
import { createId } from '../models/types'
import { roundMoney } from './money'

const TOTAL_KEYWORDS = [
  'subtotal',
  'sub total',
  'tax',
  'vat',
  'tip',
  'gratuity',
  'total',
  'amount due',
  'balance due',
]

const ADJUSTMENT_PATTERNS: { regex: RegExp; type: AdjustmentType }[] = [
  { regex: /\bdiscount\b|\d+%\s*off|\boff\b/i, type: 'discount' },
  { regex: /service\s*charge|svc\s*chg/i, type: 'serviceCharge' },
  { regex: /2\s*for\s*1|bogo|buy\s*one/i, type: 'multiBuyDeal' },
]

const PRICE_REGEX = /(\d+[.,]\d{2})\s*$/
const QTY_REGEX = /^(\d+)\s*[x×]\s*/i

export interface ParsedReceipt {
  merchantName: string
  items: LineItem[]
  adjustments: BillAdjustment[]
  subtotal: number
  tax: number
  total: number
  currencyCode: string
}

function parsePrice(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

function isTotalsLine(line: string): boolean {
  const lower = line.toLowerCase()
  return TOTAL_KEYWORDS.some((k) => lower.includes(k))
}

function detectAdjustment(line: string): BillAdjustment | null {
  for (const { regex, type } of ADJUSTMENT_PATTERNS) {
    if (regex.test(line)) {
      const match = line.match(PRICE_REGEX)
      const amount = match ? parsePrice(match[1]) : 0
      return {
        id: createId(),
        label: line.replace(PRICE_REGEX, '').trim() || line.trim(),
        amount: type === 'discount' ? -Math.abs(amount) : Math.abs(amount),
        adjustmentType: type,
        handling: 'unresolved',
        affectedItemIds: [],
      }
    }
  }
  if (/%/.test(line) && PRICE_REGEX.test(line)) {
    const match = line.match(PRICE_REGEX)!
    return {
      id: createId(),
      label: line.replace(PRICE_REGEX, '').trim(),
      amount: -Math.abs(parsePrice(match[1])),
      adjustmentType: 'discount',
      handling: 'unresolved',
      affectedItemIds: [],
    }
  }
  return null
}

function parseItemLine(line: string, confidence: number): LineItem | null {
  const priceMatch = line.match(PRICE_REGEX)
  if (!priceMatch) return null

  const price = parsePrice(priceMatch[1])
  let namePart = line.replace(PRICE_REGEX, '').trim()
  let quantity = 1

  const qtyMatch = namePart.match(QTY_REGEX)
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10)
    namePart = namePart.replace(QTY_REGEX, '').trim()
  }

  if (!namePart) return null

  const unitPrice = roundMoney(price / quantity, 'USD')
  return {
    id: createId(),
    name: namePart,
    unitPrice,
    quantity,
    lineTotal: price,
    source: 'ocr',
    ocrConfidence: confidence,
    isDisregarded: false,
    assignedShares: [],
  }
}

export function parseReceiptText(
  text: string,
  currencyCode = 'USD',
): ParsedReceipt {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const merchantName = lines[0] ?? 'Receipt'
  const totalsStart = lines.findIndex((l) => isTotalsLine(l))
  const itemLines =
    totalsStart === -1 ? lines.slice(1) : lines.slice(1, totalsStart)
  const totalsLines = totalsStart === -1 ? [] : lines.slice(totalsStart)

  const items: LineItem[] = []
  const adjustments: BillAdjustment[] = []

  for (const line of itemLines) {
    const adjustment = detectAdjustment(line)
    if (adjustment) {
      adjustments.push(adjustment)
      continue
    }

    const item = parseItemLine(line, 0.85)
    if (item) {
      items.push(item)
    } else {
      items.push({
        id: createId(),
        name: line,
        unitPrice: 0,
        quantity: 1,
        lineTotal: 0,
        source: 'ocr',
        ocrConfidence: 0.4,
        isDisregarded: false,
        assignedShares: [],
      })
    }
  }

  let subtotal = 0
  let tax = 0
  let total = 0

  for (const line of totalsLines) {
    const lower = line.toLowerCase()
    const match = line.match(PRICE_REGEX)
    if (!match) continue
    const val = parsePrice(match[1])
    if (lower.includes('subtotal') || lower.includes('sub total')) subtotal = val
    else if (lower.includes('tax') || lower.includes('vat')) tax = val
    else if (lower.includes('total') && !lower.includes('sub')) total = val
  }

  if (subtotal === 0) {
    subtotal = items
      .filter((i) => !i.isDisregarded)
      .reduce((s, i) => s + i.lineTotal, 0)
  }
  if (total === 0) total = subtotal + tax

  return {
    merchantName,
    items,
    adjustments,
    subtotal: roundMoney(subtotal, currencyCode),
    tax: roundMoney(tax, currencyCode),
    total: roundMoney(total, currencyCode),
    currencyCode,
  }
}

export const SAMPLE_RECEIPT_TEXT = `The Green Table
123 Main Street
2026-08-02

2x Cappuccino        9.00
Avocado Toast       14.50
Side Salad           6.00
10% Loyalty Off     -2.95

Subtotal            26.55
Tax                  2.12
Total               28.67`
