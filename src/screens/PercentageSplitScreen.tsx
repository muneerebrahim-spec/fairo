import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { percentageSum } from '../services/tipCalculator'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'PercentageSplit'>

export function PercentageSplitScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, updateSplit } = useSplitStore()

  if (!activeSplit) return null

  const allocated = percentageSum(activeSplit)
  const canContinue = Math.abs(allocated - 100) < 0.01

  const adjust = (participantId: string, delta: number) => {
    const current = activeSplit.percentageAllocations[participantId] ?? 0
    const next = Math.min(100, Math.max(0, current + delta))
    updateSplit({
      percentageAllocations: {
        ...activeSplit.percentageAllocations,
        [participantId]: next,
      },
    })
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="Set percentages"
          subtitle={`Total allocated: ${allocated.toFixed(0)}%`}
        />

        {activeSplit.participants.map((p) => (
          <Card key={p.id} style={styles.row}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {p.displayName}
            </Text>
            <View style={styles.controls}>
              <Button
                label="−"
                variant="secondary"
                onPress={() => adjust(p.id, -5)}
                style={styles.stepBtn}
              />
              <Text style={[styles.pct, { color: colors.textPrimary }]}>
                {(activeSplit.percentageAllocations[p.id] ?? 0).toFixed(0)}%
              </Text>
              <Button
                label="+"
                variant="secondary"
                onPress={() => adjust(p.id, 5)}
                style={styles.stepBtn}
              />
            </View>
          </Card>
        ))}

        <Button
          label="Continue"
          disabled={!canContinue}
          onPress={() => navigation.navigate('Tip')}
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
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    minWidth: 48,
  },
  pct: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
})
