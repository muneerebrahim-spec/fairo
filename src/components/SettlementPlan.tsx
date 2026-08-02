import type { Settlement } from '../types'
import { formatCurrency } from '../utils/settlement'

interface SettlementPlanProps {
  settlements: Settlement[]
}

export function SettlementPlan({ settlements }: SettlementPlanProps) {
  if (settlements.length === 0) return null

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-lg font-semibold text-emerald-900">
        Suggested settlements
      </h2>
      <p className="mt-1 text-sm text-emerald-700">
        Minimum payments to settle everyone up.
      </p>

      <ul className="mt-4 space-y-3">
        {settlements.map((s, i) => (
          <li
            key={`${s.fromId}-${s.toId}-${i}`}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm text-slate-700">
              <strong className="text-slate-900">{s.fromName}</strong> pays{' '}
              <strong className="text-slate-900">{s.toName}</strong>
            </span>
            <span className="font-semibold text-emerald-700">
              {formatCurrency(s.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
