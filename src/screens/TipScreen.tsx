import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import {
  calculateParticipantTotals,
  calculateTipAmount,
} from '../services/tipCalculator'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Tip'>

const PRESETS = [10, 15, 20]

export function TipScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, updateSplit } = useSplitStore()

  const totals = useMemo(
    () => (activeSplit ? calculateParticipantTotals(activeSplit) : []),
    [activeSplit],
  )

  if (!activeSplit) return null

  const tipAmount = calculateTipAmount(activeSplit)

  const setTipMode = (mode: 'none' | 'percentage' | 'flat', value?: number) => {
    updateSplit({
      tip: {
        ...activeSplit.tip,
        mode,
        percentage: mode === 'percentage' ? value ?? 15 : undefined,
        flatAmount: mode === 'flat' ? value ?? 0 : undefined,
      },
    })
  }

  const setOverride = (participantId: string, amount: string) => {
    const parsed = parseFloat(amount)
    const overrides = { ...activeSplit.tip.perPersonOverrides }
    if (isNaN(parsed)) delete overrides[participantId]
    else overrides[participantId] = parsed
    updateSplit({
      tip: { ...activeSplit.tip, perPersonOverrides: overrides },
    })
  }

  const resetOverride = (participantId: string) => {
    const overrides = { ...activeSplit.tip.perPersonOverrides }
    delete overrides[participantId]
    updateSplit({
      tip: { ...activeSplit.tip, perPersonOverrides: overrides },
    })
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Add a tip"
          subtitle="Choose a tip amount and adjust per person if needed."
        />

        <View style={styles.presets}>
          <Button label="No tip" variant="secondary" onPress={() => setTipMode('none')} />
          {PRESETS.map((p) => (
            <Button
              key={p}
              label={`${p}%`}
              variant={activeSplit.tip.mode === 'percentage' && activeSplit.tip.percentage === p ? 'primary' : 'secondary'}
              onPress={() => setTipMode('percentage', p)}
            />
          ))}
        </View>

        <Card>
          <Pressable
            onPress={() =>
              updateSplit({
                tip: { ...activeSplit.tip, baseIsTotal: !activeSplit.tip.baseIsTotal },
              })
            }
          >
            <Text style={{ color: colors.textSecondary }}>
              Percentage base:{' '}
              {activeSplit.tip.baseIsTotal ? 'Total incl. tax' : 'Subtotal'}
            </Text>
          </Pressable>
          <Text style={[styles.tipTotal, { color: colors.textPrimary }]}>
            Tip total: {formatMoney(tipAmount, activeSplit.currencyCode)}
          </Text>
        </Card>

        {totals.map((pt) => (
          <Card key={pt.participantId}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {pt.displayName}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Total: {formatMoney(pt.total, activeSplit.currencyCode)}
            </Text>
            <TextInput
              placeholder="Custom tip override"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              defaultValue={
                activeSplit.tip.perPersonOverrides[pt.participantId]?.toString() ?? ''
              }
              onChangeText={(v) => setOverride(pt.participantId, v)}
              style={[
                styles.input,
                { color: colors.textPrimary, borderColor: colors.border },
              ]}
            />
            {activeSplit.tip.perPersonOverrides[pt.participantId] !== undefined && (
              <Pressable onPress={() => resetOverride(pt.participantId)}>
                <Text style={{ color: colors.pop }}>Reset to default</Text>
              </Pressable>
            )}
          </Card>
        ))}

        <Button label="View summary" onPress={() => navigation.navigate('Summary', { readonly: false })} />
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
  presets: {
    gap: spacing.sm,
  },
  tipTotal: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    fontSize: 15,
  },
})
