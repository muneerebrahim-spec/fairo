import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import { unassignedItems } from '../services/reconciliation'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Reconciliation'>

export function ReconciliationScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, resolveReconciliationEvenly, runReconciliation, setActiveSplit } =
    useSplitStore()

  if (!activeSplit) return null

  const status = activeSplit.reconciliationStatus
  const outstanding = unassignedItems(activeSplit)

  const resolveEvenly = () => {
    resolveReconciliationEvenly()
    const next = runReconciliation()
    if (next.reconciliationStatus.type === 'balanced') {
      navigation.replace('Tip')
    }
  }

  const assignManually = () => {
    navigation.replace('AssignItems')
  }

  const amount =
    status.type === 'leftoverUnassigned'
      ? status.amount
      : status.type === 'overassigned'
        ? status.amount
        : 0

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="Almost balanced"
          subtitle={
            status.type === 'leftoverUnassigned'
              ? 'Some items still need to be assigned.'
              : 'Assigned amounts exceed the bill total.'
          }
        />

        <Card>
          <Text style={[styles.amount, { color: colors.pop }]}>
            {formatMoney(amount, activeSplit.currencyCode)}{' '}
            {status.type === 'leftoverUnassigned' ? 'unassigned' : 'overassigned'}
          </Text>
          {outstanding.map((item) => (
            <Text
              key={item.id}
              style={[styles.itemLine, { color: colors.textSecondary }]}
            >
              • {item.name} — {formatMoney(item.lineTotal, activeSplit.currencyCode)}
            </Text>
          ))}
        </Card>

        <Button label="Split evenly across everyone" onPress={resolveEvenly} />
        <Button
          label="Assign to a person"
          variant="secondary"
          onPress={assignManually}
        />
        <Button
          label="Back to assign items"
          variant="secondary"
          onPress={() => {
            setActiveSplit({ ...activeSplit, status: 'assigning' })
            navigation.goBack()
          }}
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  itemLine: {
    fontSize: 14,
    lineHeight: 22,
  },
})
