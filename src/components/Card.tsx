import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { radii, spacing } from '../theme/tokens'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
  const { colors, scheme } = useTheme()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...(scheme === 'dark'
            ? {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 0,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

interface BadgeProps {
  label: string
}

export function PopBadge({ label }: BadgeProps) {
  const { colors } = useTheme()
  return (
    <View style={[styles.badge, { backgroundColor: colors.pop }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  )
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.badge,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    gap: 4,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
})
