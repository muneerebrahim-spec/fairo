import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { RootStackParamList } from '../navigation/types'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>

export function ProcessingScreen(_props: Props) {
  const { colors } = useTheme()

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.accentBright} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Processing receipt
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Extracting items, totals, and adjustments…
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
})
