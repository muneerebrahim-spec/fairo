import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { createId } from '../models/types'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import { activeItems } from '../services/reconciliation'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewStepThrough'>

export function ReviewStepThroughScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, updateSplit, stepThroughIndex, setStepThroughIndex } =
    useSplitStore()

  if (!activeSplit) return null

  const visibleItems = activeItems(activeSplit.items)
  const item = visibleItems[stepThroughIndex]

  const goNext = () => {
    if (stepThroughIndex < visibleItems.length - 1) {
      setStepThroughIndex(stepThroughIndex + 1)
    } else {
      const unresolved = activeSplit.adjustments.find(
        (a) => a.handling === 'unresolved',
      )
      if (unresolved) {
        navigation.navigate('AdjustmentPrompt', { adjustmentId: unresolved.id })
      } else {
        navigation.navigate('Participants')
      }
    }
  }

  if (!item) {
    navigation.replace('Participants')
    return null
  }

  const disregard = () => {
    updateSplit({
      items: activeSplit.items.map((i) =>
        i.id === item.id ? { ...i, isDisregarded: true } : i,
      ),
    })
    goNext()
  }

  const addBelow = () => {
    const idx = activeSplit.items.findIndex((i) => i.id === item.id)
    const newItems = [...activeSplit.items]
    newItems.splice(idx + 1, 0, {
      id: createId(),
      name: 'New item',
      unitPrice: 0,
      quantity: 1,
      lineTotal: 0,
      source: 'manual',
      isDisregarded: false,
      assignedShares: [],
    })
    updateSplit({ items: newItems })
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>
          Item {stepThroughIndex + 1} of {visibleItems.length}
        </Text>
        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            value={item.name}
            onChangeText={(name) =>
              updateSplit({
                items: activeSplit.items.map((i) =>
                  i.id === item.id ? { ...i, name } : i,
                ),
              })
            }
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total</Text>
          <TextInput
            value={String(item.lineTotal)}
            keyboardType="decimal-pad"
            onChangeText={(val) => {
              const lineTotal = parseFloat(val) || 0
              updateSplit({
                items: activeSplit.items.map((i) =>
                  i.id === item.id
                    ? { ...i, lineTotal, unitPrice: lineTotal / i.quantity }
                    : i,
                ),
              })
            }}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
          />
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            {formatMoney(item.lineTotal, activeSplit.currencyCode)}
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button label="Confirm" onPress={goNext} />
          <Button label="Disregard" variant="secondary" onPress={disregard} />
          <Button label="Add Item Below" variant="secondary" onPress={addBelow} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
})
