interface PeopleListProps {
  people: { id: string; name: string }[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
}

export function PeopleList({ people, onAdd, onRemove }: PeopleListProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('name') as HTMLInputElement
    const name = input.value.trim()
    if (!name) return
    onAdd(name)
    input.value = ''
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">People</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add everyone sharing the bill.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          name="name"
          type="text"
          placeholder="Name"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add
        </button>
      </form>

      {people.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No people added yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-800">
                {person.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(person.id)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
