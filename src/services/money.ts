const MINOR_UNITS: Record<string, number> = {
  USD: 100,
  ZAR: 100,
  EUR: 100,
  GBP: 100,
}

export function minorUnits(currencyCode: string): number {
  return MINOR_UNITS[currencyCode] ?? 100
}

export function toMinor(amount: number, currencyCode: string): number {
  return Math.round(amount * minorUnits(currencyCode))
}

export function fromMinor(minor: number, currencyCode: string): number {
  return minor / minorUnits(currencyCode)
}

export function roundMoney(amount: number, currencyCode: string): number {
  return fromMinor(toMinor(amount, currencyCode), currencyCode)
}

export function formatMoney(
  amount: number,
  currencyCode: string,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(roundMoney(amount, currencyCode))
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function distributeWithRemainder(
  totalMinor: number,
  weights: number[],
): number[] {
  if (weights.length === 0) return []
  const weightSum = weights.reduce((a, b) => a + b, 0)
  if (weightSum === 0) {
    const base = Math.floor(totalMinor / weights.length)
    const remainder = totalMinor - base * weights.length
    return weights.map((_, i) => base + (i === 0 ? remainder : 0))
  }

  const raw = weights.map((w) => (totalMinor * w) / weightSum)
  const floored = raw.map((v) => Math.floor(v))
  let leftover = totalMinor - floored.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  const result = [...floored]
  for (const { i } of order) {
    if (leftover <= 0) break
    result[i] += 1
    leftover -= 1
  }
  return result
}
