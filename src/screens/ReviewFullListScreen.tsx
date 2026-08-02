import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native'
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

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewFullList'>

export function ReviewFullListScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, updateSplit } = useSplitStore()

  const items = useMemo(
    () => activeSplit?.items ?? [],
    [activeSplit?.items],
  )

  if (!activeSplit) return null

  const toggleDisregard = (id: string) => {
    updateSplit({
      items: activeSplit.items.map((i) =>
        i.id === id ? { ...i, isDisregarded: !i.isDisregarded } : i,
      ),
    })
  }

  const addManualItem = () => {
    updateSplit({
      items: [
        ...activeSplit.items,
        {
          id: createId(),
          name: 'New item',
          unitPrice: 0,
          quantity: 1,
          lineTotal: 0,
          source: 'manual',
          isDisregarded: false,
          assignedShares: [],
        },
      ],
    })
  }

  const continueNext = () => {
    const unresolved = activeSplit.adjustments.find(
      (a) => a.handling === 'unresolved',
    )
    if (unresolved) {
      navigation.navigate('AdjustmentPrompt', { adjustmentId: unresolved.id })
    } else {
      navigation.navigate('Participants')
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
          <Card
            key={item.id}
            style={{ opacity: item.isDisregarded ? 0.5 : 1 }}
          >
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
            <Pressable onPress={() => toggleDisregard(item.id)}>
              <Text style={{ color: colors.pop }}>
                {item.isDisregarded ? 'Restore' : 'Disregard'}
              </Text>
            </Pressable>
          </Card>
        ))}

        <Button label="+ Add Item" variant="secondary" onPress={addManualItem} />

        <Card>
          <Text style={{ color: colors.textSecondary }}>
            Subtotal: {formatMoney(activeSplit.subtotal, activeSplit.currencyCode)}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            Tax: {formatMoney(activeSplit.tax, activeSplit.currencyCode)}
          </Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
            Total: {formatMoney(activeSplit.total, activeSplit.currencyCode)}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            {activeItems(activeSplit.items).length} active items
          </Text>
        </Card>

        <Button label="Continue" onPress={continueNext} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    fontSize: 15,
  },
})
