import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { LineItem, Split } from '../models/types'
import { formatMoney } from '../services/money'
import { Avatar } from './Avatar'
import { useTheme } from '../theme/ThemeContext'
import { radii, spacing } from '../theme/tokens'

interface LineItemRowProps {
  item: LineItem
  split: Split
  selected?: boolean
  onPress?: () => void
}

export function LineItemRow({
  item,
  split,
  selected = false,
  onPress,
}: LineItemRowProps) {
  const { colors } = useTheme()
  const assignees = item.assignedShares
    .map((s) => split.participants.find((p) => p.id === s.participantId))
    .filter(Boolean)
  const unassigned = assignees.length === 0
  const lowConfidence =
    item.source === 'ocr' &&
    item.ocrConfidence !== undefined &&
    item.ocrConfidence < 0.75

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: selected ? `${colors.pop}14` : colors.card,
          borderColor: selected ? colors.pop : colors.border,
          opacity: item.isDisregarded ? 0.45 : 1,
        },
      ]}
    >
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {lowConfidence && (
            <View
              style={[styles.flag, { backgroundColor: `${colors.pop}22` }]}
            >
              <Text style={[styles.flagText, { color: colors.pop }]}>?</Text>
            </View>
          )}
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          x{item.quantity} ·{' '}
          {formatMoney(item.lineTotal, split.currencyCode)}
        </Text>
      </View>

      <View style={styles.trailing}>
        {unassigned ? (
          <View style={[styles.dot, { backgroundColor: colors.amberDot }]} />
        ) : (
          <View style={styles.avatarStack}>
            {assignees.slice(0, 3).map((p, i) => (
              <View
                key={p!.id}
                style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -8 }]}
              >
                <Avatar
                  label={p!.displayName}
                  color={p!.avatarColor}
                  size={28}
                  mini
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radii.card - 4,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  main: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  flag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 36,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackItem: {},
})
