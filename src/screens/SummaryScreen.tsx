import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMemo, useState } from 'react'
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, PopBadge, SectionTitle } from '../components/Card'
import { HeroCard } from '../components/HeroCard'
import { LineItemRow } from '../components/LineItemRow'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import { activeItems } from '../services/reconciliation'
import { buildShareText } from '../services/shareText'
import {
  calculateParticipantTotals,
  calculateTipAmount,
} from '../services/tipCalculator'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>

export function SummaryScreen({ navigation, route }: Props) {
  const { colors } = useTheme()
  const { activeSplit, history, saveHistory, discardSplit } = useSplitStore()
  const [sharing, setSharing] = useState(false)

  const split = useMemo(() => {
    if (route.params.readonly && route.params.splitId) {
      return history.find((s) => s.id === route.params.splitId) ?? activeSplit
    }
    return activeSplit
  }, [activeSplit, history, route.params])

  const totals = useMemo(
    () => (split ? calculateParticipantTotals(split) : []),
    [split],
  )

  if (!split) return null

  const tipAmount = calculateTipAmount(split)
  const readonly = route.params.readonly
  const isBalanced = split.reconciliationStatus.type === 'balanced'

  const share = async () => {
    setSharing(true)
    const text = buildShareText(split)
    await Share.share({ message: text })
    setSharing(false)
  }

  const finish = async (save: boolean) => {
    if (save) {
      await saveHistory()
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    } else {
      discardSplit()
    }
    navigation.popToTop()
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <HeroCard style={styles.hero}>
          <Text style={[styles.heroLabel, { color: colors.heroSubtext }]}>
            Total
          </Text>
          <Text style={[styles.heroAmount, { color: colors.heroText }]}>
            {formatMoney(split.total + tipAmount, split.currencyCode)}
          </Text>
          <Text style={[styles.heroMeta, { color: colors.heroSubtext }]}>
            {split.title} · {new Date(split.date).toLocaleDateString()}
          </Text>
          {isBalanced && (
            <View style={styles.badgeWrap}>
              <PopBadge label="Balanced" />
            </View>
          )}
        </HeroCard>

        <SectionTitle title="Items" />
        {activeItems(split.items).map((item) => (
          <LineItemRow key={item.id} item={item} split={split} />
        ))}

        <Card style={styles.totalsCard}>
          <Row label="Subtotal" value={formatMoney(split.subtotal, split.currencyCode)} />
          <Row label="Tax" value={formatMoney(split.tax, split.currencyCode)} />
          <Row label="Tip" value={formatMoney(tipAmount, split.currencyCode)} />
          <Row
            label="Total"
            value={formatMoney(split.total + tipAmount, split.currencyCode)}
            bold
          />
        </Card>

        <SectionTitle title="Per person" />
        {totals.map((pt) => (
          <Card key={pt.participantId} style={styles.personCard}>
            <Text style={[styles.personName, { color: colors.textPrimary }]}>
              {pt.displayName}
            </Text>
            <Text style={[styles.personTotal, { color: colors.accentDeep }]}>
              {formatMoney(pt.total, split.currencyCode)}
            </Text>
            <Text style={[styles.personBreakdown, { color: colors.textSecondary }]}>
              items {formatMoney(pt.itemsTotal, split.currencyCode)} + tax{' '}
              {formatMoney(pt.taxShare, split.currencyCode)} + tip{' '}
              {formatMoney(pt.tipShare, split.currencyCode)}
            </Text>
          </Card>
        ))}

        <Button label="Share breakdown" onPress={share} loading={sharing} />

        {!readonly && (
          <View style={styles.finishRow}>
            <Button
              label="Save to History"
              onPress={() => finish(true)}
              style={styles.finishBtn}
            />
            <Button
              label="Discard"
              variant="secondary"
              onPress={() => finish(false)}
              style={styles.finishBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: colors.textSecondary, fontWeight: bold ? '700' : '400' },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          { color: colors.textPrimary, fontWeight: bold ? '700' : '600' },
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.sm,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontSize: 14,
    marginTop: 8,
  },
  badgeWrap: {
    marginTop: spacing.md,
  },
  totalsCard: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
  },
  personCard: {
    gap: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
  },
  personTotal: {
    fontSize: 22,
    fontWeight: '700',
  },
  personBreakdown: {
    fontSize: 13,
    lineHeight: 18,
  },
  finishRow: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  finishBtn: {},
})
