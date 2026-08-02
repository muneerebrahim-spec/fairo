import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { radii } from '../theme/tokens'

interface AvatarProps {
  label: string
  color: string
  size?: number
  selected?: boolean
  onPress?: () => void
  mini?: boolean
}

export function Avatar({
  label,
  color,
  size = 44,
  selected = false,
  onPress,
  mini = false,
}: AvatarProps) {
  const { colors } = useTheme()
  const initials = label
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const radius = mini ? radii.avatarMini : radii.avatar
  const fontSize = mini ? 9 : size <= 36 ? 11 : 14

  const content = (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: selected ? colors.pop : 'transparent',
          borderWidth: selected ? 2.5 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: size - (selected ? 6 : 0),
            height: size - (selected ? 6 : 0),
            borderRadius: radius - 1,
            backgroundColor: color,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize }]}>{initials}</Text>
      </View>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    )
  }
  return content
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
  },
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
