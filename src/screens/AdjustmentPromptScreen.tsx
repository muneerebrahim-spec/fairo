import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'AdjustmentPrompt'>

export function AdjustmentPromptScreen({ navigation, route }: Props) {
  const { colors } = useTheme()
  const { activeSplit, resolveAdjustment } = useSplitStore()
  const { adjustmentId } = route.params

  if (!activeSplit) return null

  const adjustment = activeSplit.adjustments.find((a) => a.id === adjustmentId)
  if (!adjustment) {
    navigation.replace('Participants')
    return null
  }

  const resolve = (handling: 'ownLine' | 'proportional') => {
    resolveAdjustment(adjustmentId, handling)
    const nextUnresolved = activeSplit.adjustments.find(
      (a) => a.id !== adjustmentId && a.handling === 'unresolved',
    )
    if (nextUnresolved) {
      navigation.replace('AdjustmentPrompt', {
        adjustmentId: nextUnresolved.id,
      })
    } else {
      navigation.replace('Participants')
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="Adjustment found"
          subtitle={`We found "${adjustment.label}" — how should this be applied?`}
        />
        <Card>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            {formatMoney(adjustment.amount, activeSplit.currencyCode)}
          </Text>
        </Card>
        <Button
          label="Treat as its own line item"
          onPress={() => resolve('ownLine')}
        />
        <Button
          label="Apply proportionally to assigned items"
          variant="secondary"
          onPress={() => resolve('proportional')}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
  },
})
