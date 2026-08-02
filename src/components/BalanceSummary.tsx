import type { Balance } from '../types'
import { formatCurrency } from '../utils/settlement'

interface BalanceSummaryProps {
  balances: Balance[]
}

export function BalanceSummary({ balances }: BalanceSummaryProps) {
  if (balances.length === 0) return null

  const totalSpent = balances.reduce(
    (sum, b) => sum + (b.net > 0 ? b.net : 0),
    0,
  )
  const isSettled = balances.every((b) => Math.abs(b.net) < 0.01)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Balances</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isSettled
          ? 'Everyone is settled up!'
          : 'Positive means owed money; negative means they owe.'}
      </p>

      <ul className="mt-4 space-y-2">
        {balances.map((balance) => (
          <li
            key={balance.personId}
            className="flex items-center justify-between rounded-lg px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-800">
              {balance.personName}
            </span>
            <span
              className={`text-sm font-semibold ${
                balance.net > 0.01
                  ? 'text-emerald-600'
                  : balance.net < -0.01
                    ? 'text-red-500'
                    : 'text-slate-400'
              }`}
            >
              {Math.abs(balance.net) < 0.01
                ? 'Settled'
                : balance.net > 0
                  ? `+${formatCurrency(balance.net)}`
                  : `-${formatCurrency(Math.abs(balance.net))}`}
            </span>
          </li>
        ))}
      </ul>

      {totalSpent > 0.01 && (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          Total outstanding: {formatCurrency(totalSpent)}
        </p>
      )}
    </section>
  )
}
