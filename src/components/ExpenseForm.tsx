import type { Person } from '../types'

interface ExpenseFormProps {
  people: Person[]
  onAdd: (expense: {
    description: string
    amount: number
    paidById: string
    splitAmongIds: string[]
  }) => void
}

export function ExpenseForm({ people, onAdd }: ExpenseFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const description = (
      form.elements.namedItem('description') as HTMLInputElement
    ).value.trim()
    const amount = parseFloat(
      (form.elements.namedItem('amount') as HTMLInputElement).value,
    )
    const paidById = (form.elements.namedItem('paidBy') as HTMLSelectElement)
      .value
    const splitCheckboxes = form.querySelectorAll<HTMLInputElement>(
      'input[name="split"]:checked',
    )
    const splitAmongIds = Array.from(splitCheckboxes).map((cb) => cb.value)

    if (!description || isNaN(amount) || amount <= 0 || !paidById) return
    if (splitAmongIds.length === 0) return

    onAdd({ description, amount, paidById, splitAmongIds })
    form.reset()
    form.querySelectorAll<HTMLInputElement>('input[name="split"]').forEach(
      (cb) => {
        cb.checked = true
      },
    )
  }

  if (people.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          Add at least one person before recording expenses.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add expense</h2>
      <p className="mt-1 text-sm text-slate-500">
        Record who paid and how to split it.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Description
          </label>
          <input
            name="description"
            type="text"
            placeholder="Dinner, groceries, rent..."
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Amount
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Paid by
          </label>
          <select
            name="paidBy"
            required
            defaultValue={people[0]?.id}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium text-slate-600">
            Split among
          </legend>
          <div className="flex flex-wrap gap-3">
            {people.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="split"
                  value={p.id}
                  defaultChecked
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add expense
        </button>
      </form>
    </section>
  )
}
