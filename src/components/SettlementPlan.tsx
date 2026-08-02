import { StyleSheet, Text, View } from 'react-native'
import type { Settlement } from '../types'
import { formatCurrency } from '../utils/settlement'
import { colors } from '../theme'

interface SettlementPlanProps {
  settlements: Settlement[]
}

export function SettlementPlan({ settlements }: SettlementPlanProps) {
  if (settlements.length === 0) return null

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Suggested settlements</Text>
      <Text style={styles.subtitle}>
        Minimum payments to settle everyone up.
      </Text>

      {settlements.map((s, i) => (
        <View key={`${s.fromId}-${s.toId}-${i}`} style={styles.item}>
          <Text style={styles.text}>
            <Text style={styles.bold}>{s.fromName}</Text> pays{' '}
            <Text style={styles.bold}>{s.toName}</Text>
          </Text>
          <Text style={styles.amount}>{formatCurrency(s.amount)}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 8,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
})
