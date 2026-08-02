import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Expense, Person } from '../types'
import { formatCurrency } from '../utils/settlement'
import { colors } from '../theme'

interface ExpenseListProps {
  expenses: Expense[]
  people: Person[]
  onRemove: (id: string) => void
}

export function ExpenseList({ expenses, people, onRemove }: ExpenseListProps) {
  const nameById = (id: string) =>
    people.find((p) => p.id === id)?.name ?? 'Unknown'

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Expenses</Text>
      <Text style={styles.subtitle}>
        {expenses.length === 0
          ? 'No expenses recorded yet.'
          : `${expenses.length} expense${expenses.length === 1 ? '' : 's'} recorded.`}
      </Text>

      {expenses.map((expense) => (
        <View key={expense.id} style={styles.item}>
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{expense.description}</Text>
            <Text style={styles.itemMeta}>
              Paid by {nameById(expense.paidById)} · Split{' '}
              {expense.splitAmongIds.length} way
              {expense.splitAmongIds.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.itemPeople}>
              {expense.splitAmongIds.map(nameById).join(', ')}
            </Text>
          </View>
          <View style={styles.itemActions}>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            <Pressable onPress={() => onRemove(expense.id)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemPeople: {
    fontSize: 12,
    color: colors.textLight,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  remove: {
    fontSize: 12,
    color: colors.textLight,
  },
})
