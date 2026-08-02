import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { radii } from '../theme/tokens'

interface HeroCardProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function HeroCard({ children, style }: HeroCardProps) {
  const { colors, scheme } = useTheme()

  return (
    <View style={[styles.wrapper, style]}>
      {scheme === 'dark' && (
        <View
          style={[
            styles.glow,
            { backgroundColor: colors.glow },
          ]}
        />
      )}
      <LinearGradient
        colors={[colors.accentDeep, colors.accentBright]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: 20,
    right: 20,
    height: 120,
    borderRadius: 60,
    opacity: 0.9,
    transform: [{ scaleX: 1.1 }],
  },
  gradient: {
    borderRadius: radii.hero,
    padding: 24,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
})
