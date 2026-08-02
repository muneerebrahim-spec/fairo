import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { formatMoney } from '../services/money'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { history, init, startNewSplit } = useSplitStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.brand, { color: colors.textPrimary }]}>Fairo</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Split bills fairly
        </Text>
      </View>

      <View style={styles.content}>
        <Button
          label="New Split"
          onPress={() => {
            startNewSplit()
            navigation.navigate('Capture')
          }}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          History
        </Text>

        {history.length === 0 ? (
          <Card>
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              No saved splits yet. Scan a receipt to get started.
            </Text>
          </Card>
        ) : (
          <FlatList
            style={styles.listFlex}
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  navigation.navigate('Summary', { readonly: true, splitId: item.id })
                }
              >
                <Card style={styles.historyCard}>
                  <Text
                    style={[styles.historyTitle, { color: colors.textPrimary }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.historyMeta, { color: colors.textSecondary }]}
                  >
                    {new Date(item.date).toLocaleDateString()} ·{' '}
                    {formatMoney(item.total, item.currencyCode)}
                  </Text>
                </Card>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brand: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  listFlex: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 14,
    marginTop: 4,
  },
})
