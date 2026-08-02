import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'CorrectionMode'>

export function CorrectionModeScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { setCorrectionMode } = useSplitStore()

  const choose = (mode: 'stepThrough' | 'fullListEdit') => {
    setCorrectionMode(mode)
    if (mode === 'stepThrough') {
      navigation.navigate('ReviewStepThrough')
    } else {
      navigation.navigate('ReviewFullList')
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="How do you want to review this scan?"
          subtitle="Choose a review style for this receipt only."
        />
        <Card style={styles.card}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
            Review items one at a time
          </Text>
          <Text style={[styles.optionBody, { color: colors.textSecondary }]}>
            Confirm, edit, or disregard each line on a full-screen card.
          </Text>
          <Button label="Step-through" onPress={() => choose('stepThrough')} />
        </Card>
        <Card style={styles.card}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
            Show full list to edit
          </Text>
          <Text style={[styles.optionBody, { color: colors.textSecondary }]}>
            See every item at once and edit inline.
          </Text>
          <Button
            label="Full list edit"
            variant="secondary"
            onPress={() => choose('fullListEdit')}
          />
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
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  optionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
})
