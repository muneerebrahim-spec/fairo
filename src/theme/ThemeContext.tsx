import { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import {
  darkColors,
  lightColors,
  type ColorScheme,
  type ThemeColors,
} from './tokens'

interface ThemeContextValue {
  scheme: ColorScheme
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  colors: lightColors,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const scheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light'
  const colors = scheme === 'dark' ? darkColors : lightColors

  const value = useMemo(() => ({ scheme, colors }), [scheme, colors])

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
