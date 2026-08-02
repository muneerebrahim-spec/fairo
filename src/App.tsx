import { useMemo, useState } from 'react'
import { BalanceSummary } from './components/BalanceSummary'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { PeopleList } from './components/PeopleList'
import { SettlementPlan } from './components/SettlementPlan'
import type { Expense, Person } from './types'
import { calculateBalances, calculateSettlements } from './utils/settlement'

function createId() {
  return crypto.randomUUID()
}

function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  const balances = useMemo(
    () => calculateBalances(people, expenses),
    [people, expenses],
  )
  const settlements = useMemo(
    () => calculateSettlements(balances),
    [balances],
  )

  const addPerson = (name: string) => {
    setPeople((prev) => [...prev, { id: createId(), name }])
  }

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setExpenses((prev) =>
      prev.filter(
        (e) =>
          e.paidById !== id &&
          !e.splitAmongIds.includes(id),
      ),
    )
  }

  const addExpense = (data: {
    description: string
    amount: number
    paidById: string
    splitAmongIds: string[]
  }) => {
    setExpenses((prev) => [
      ...prev,
      { id: createId(), ...data },
    ])
  }

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              FairSplit
            </h1>
            <p className="text-sm text-slate-500">
              Split bills fairly with friends
            </p>
          </div>
          {totalExpenses > 0 && (
            <div className="rounded-xl bg-emerald-100 px-4 py-2 text-right">
              <p className="text-xs font-medium text-emerald-700">Total</p>
              <p className="text-lg font-bold text-emerald-800">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-2">
        <div className="space-y-6">
          <PeopleList
            people={people}
            onAdd={addPerson}
            onRemove={removePerson}
          />
          <ExpenseForm people={people} onAdd={addExpense} />
        </div>

        <div className="space-y-6">
          <ExpenseList
            expenses={expenses}
            people={people}
            onRemove={removeExpense}
          />
          <BalanceSummary balances={balances} />
          <SettlementPlan settlements={settlements} />
        </div>
      </main>
    </div>
  )
}

export default App
