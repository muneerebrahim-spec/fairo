import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context'
import { BalanceSummary } from './src/components/BalanceSummary'
import { ExpenseForm } from './src/components/ExpenseForm'
import { ExpenseList } from './src/components/ExpenseList'
import { PeopleList } from './src/components/PeopleList'
import { SettlementPlan } from './src/components/SettlementPlan'
import { colors } from './src/theme'
import type { Expense, Person } from './src/types'
import {
  calculateBalances,
  calculateSettlements,
  formatCurrency,
} from './src/utils/settlement'

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
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
        (e) => e.paidById !== id && !e.splitAmongIds.includes(id),
      ),
    )
  }

  const addExpense = (data: {
    description: string
    amount: number
    paidById: string
    splitAmongIds: string[]
  }) => {
    setExpenses((prev) => [...prev, { id: createId(), ...data }])
  }

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>FairSplit</Text>
              <Text style={styles.headerSubtitle}>
                Split bills fairly with friends
              </Text>
            </View>
            {totalExpenses > 0 && (
              <View style={styles.totalBadge}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <PeopleList
              people={people}
              onAdd={addPerson}
              onRemove={removePerson}
            />
            <ExpenseForm people={people} onAdd={addExpense} />
            <ExpenseList
              expenses={expenses}
              people={people}
              onRemove={removeExpense}
            />
            <BalanceSummary balances={balances} />
            <SettlementPlan settlements={settlements} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
})
