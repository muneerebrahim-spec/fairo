import { StyleSheet, Text, View } from 'react-native'
import type { Balance } from '../types'
import { formatCurrency } from '../utils/settlement'
import { colors } from '../theme'

interface BalanceSummaryProps {
  balances: Balance[]
}

export function BalanceSummary({ balances }: BalanceSummaryProps) {
  if (balances.length === 0) return null

  const isSettled = balances.every((b) => Math.abs(b.net) < 0.01)
  const totalOutstanding = balances.reduce(
    (sum, b) => sum + (b.net > 0 ? b.net : 0),
    0,
  )

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Balances</Text>
      <Text style={styles.subtitle}>
        {isSettled
          ? 'Everyone is settled up!'
          : 'Positive = owed money · Negative = owes money'}
      </Text>

      {balances.map((balance) => (
        <View key={balance.personId} style={styles.row}>
          <Text style={styles.name}>{balance.personName}</Text>
          <Text
            style={[
              styles.net,
              balance.net > 0.01
                ? styles.positive
                : balance.net < -0.01
                  ? styles.negative
                  : styles.neutral,
            ]}
          >
            {Math.abs(balance.net) < 0.01
              ? 'Settled'
              : balance.net > 0
                ? `+${formatCurrency(balance.net)}`
                : `-${formatCurrency(Math.abs(balance.net))}`}
          </Text>
        </View>
      ))}

      {totalOutstanding > 0.01 && (
        <Text style={styles.footer}>
          Total outstanding: {formatCurrency(totalOutstanding)}
        </Text>
      )}
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
    gap: 10,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  net: {
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: colors.primary,
  },
  negative: {
    color: colors.danger,
  },
  neutral: {
    color: colors.textLight,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
})
