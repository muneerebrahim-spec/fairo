import type { Expense, Person } from '../types'
import { formatCurrency } from '../utils/settlement'

interface ExpenseListProps {
  expenses: Expense[]
  people: Person[]
  onRemove: (id: string) => void
}

export function ExpenseList({ expenses, people, onRemove }: ExpenseListProps) {
  const nameById = (id: string) =>
    people.find((p) => p.id === id)?.name ?? 'Unknown'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
      <p className="mt-1 text-sm text-slate-500">
        {expenses.length === 0
          ? 'No expenses recorded yet.'
          : `${expenses.length} expense${expenses.length === 1 ? '' : 's'} recorded.`}
      </p>

      {expenses.length > 0 && (
        <ul className="mt-4 space-y-3">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {expense.description}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Paid by {nameById(expense.paidById)} · Split{' '}
                  {expense.splitAmongIds.length} way
                  {expense.splitAmongIds.length === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {expense.splitAmongIds.map(nameById).join(', ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(expense.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
