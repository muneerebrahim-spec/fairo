import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { SplitMode } from '../models/types'
import type { RootStackParamList } from '../navigation/types'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'SplitMode'>

export function SplitModeScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { setSplitMode } = useSplitStore()

  const choose = (mode: SplitMode) => {
    setSplitMode(mode)
    if (mode === 'byItem') navigation.navigate('AssignItems')
    else if (mode === 'even') navigation.navigate('Tip')
    else navigation.navigate('PercentageSplit')
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="Choose split mode"
          subtitle="Assign items individually, split evenly, or set custom percentages."
        />
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>By Item</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Assign each line item to one or more people.
          </Text>
          <Button label="By Item" onPress={() => choose('byItem')} />
        </Card>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Even</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Split the total equally across everyone.
          </Text>
          <Button label="Even split" variant="secondary" onPress={() => choose('even')} />
        </Card>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Percentage</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Set a custom percentage per person.
          </Text>
          <Button label="Percentage" variant="secondary" onPress={() => choose('percentage')} />
        </Card>
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
  card: {
    gap: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
})
