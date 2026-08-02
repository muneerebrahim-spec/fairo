import type { Balance, Expense, Person, Settlement } from '../types'

export function calculateBalances(
  people: Person[],
  expenses: Expense[],
): Balance[] {
  const totals = new Map<string, number>()

  for (const person of people) {
    totals.set(person.id, 0)
  }

  for (const expense of expenses) {
    if (expense.splitAmongIds.length === 0) continue

    const share = expense.amount / expense.splitAmongIds.length
    totals.set(
      expense.paidById,
      (totals.get(expense.paidById) ?? 0) + expense.amount,
    )

    for (const id of expense.splitAmongIds) {
      totals.set(id, (totals.get(id) ?? 0) - share)
    }
  }

  return people.map((person) => ({
    personId: person.id,
    personName: person.name,
    net: Math.round((totals.get(person.id) ?? 0) * 100) / 100,
  }))
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ ...b, net: -b.net }))
    .sort((a, b) => b.net - a.net)

  const creditors = balances
    .filter((b) => b.net > 0.01)
    .sort((a, b) => b.net - a.net)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].net, creditors[j].net)
    if (amount < 0.01) break

    settlements.push({
      fromId: debtors[i].personId,
      fromName: debtors[i].personName,
      toId: creditors[j].personId,
      toName: creditors[j].personName,
      amount: Math.round(amount * 100) / 100,
    })

    debtors[i].net -= amount
    creditors[j].net -= amount

    if (debtors[i].net < 0.01) i++
    if (creditors[j].net < 0.01) j++
  }

  return settlements
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
