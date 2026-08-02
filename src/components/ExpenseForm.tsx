import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { Person } from '../types'
import { colors } from '../theme'

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
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidById, setPaidById] = useState<string | null>(null)
  const [splitIds, setSplitIds] = useState<Set<string>>(new Set())

  const effectivePaidBy = paidById ?? people[0]?.id ?? ''
  const effectiveSplit =
    splitIds.size > 0 ? splitIds : new Set(people.map((p) => p.id))

  const toggleSplit = (id: string) => {
    setSplitIds((prev) => {
      const next = new Set(prev.size > 0 ? prev : people.map((p) => p.id))
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    const parsed = parseFloat(amount)
    if (!description.trim() || isNaN(parsed) || parsed <= 0 || !effectivePaidBy)
      return
    if (effectiveSplit.size === 0) return

    onAdd({
      description: description.trim(),
      amount: parsed,
      paidById: effectivePaidBy,
      splitAmongIds: Array.from(effectiveSplit),
    })
    setDescription('')
    setAmount('')
    setSplitIds(new Set())
  }

  if (people.length === 0) {
    return (
      <View style={[styles.card, styles.placeholder]}>
        <Text style={styles.subtitle}>
          Add at least one person before recording expenses.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Add expense</Text>
      <Text style={styles.subtitle}>Record who paid and how to split it.</Text>

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Dinner, groceries, rent..."
        placeholderTextColor={colors.textLight}
        style={styles.input}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={colors.textLight}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Paid by</Text>
      <View style={styles.chipRow}>
        {people.map((p) => (
          <Pressable
            key={p.id}
            style={[
              styles.chip,
              effectivePaidBy === p.id && styles.chipSelected,
            ]}
            onPress={() => setPaidById(p.id)}
          >
            <Text
              style={[
                styles.chipText,
                effectivePaidBy === p.id && styles.chipTextSelected,
              ]}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Split among</Text>
      <View style={styles.chipRow}>
        {people.map((p) => {
          const selected = effectiveSplit.has(p.id)
          return (
            <Pressable
              key={p.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleSplit(p.id)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {p.name}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Pressable style={styles.submit} onPress={handleSubmit}>
        <Text style={styles.submitText}>Add expense</Text>
      </Pressable>
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
    gap: 8,
  },
  placeholder: {
    borderStyle: 'dashed',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
})
