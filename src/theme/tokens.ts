export type ColorScheme = 'light' | 'dark'

export interface ThemeColors {
  background: string
  card: string
  textPrimary: string
  textSecondary: string
  accentDeep: string
  accentBright: string
  pop: string
  border: string
  heroText: string
  heroSubtext: string
  primaryButtonText: string
  glow: string
  amberDot: string
  lowConfidence: string
}

export const lightColors: ThemeColors = {
  background: '#F6F7F2',
  card: '#FFFFFF',
  textPrimary: '#10201A',
  textSecondary: '#7A8A7F',
  accentDeep: '#047857',
  accentBright: '#10B981',
  pop: '#D97706',
  border: '#E2E9E0',
  heroText: '#FFFFFF',
  heroSubtext: 'rgba(255,255,255,0.85)',
  primaryButtonText: '#FFFFFF',
  glow: 'rgba(16,185,129,0.28)',
  amberDot: '#D97706',
  lowConfidence: '#D97706',
}

export const darkColors: ThemeColors = {
  background: '#0A130E',
  card: '#12201A',
  textPrimary: '#EEF5EF',
  textSecondary: '#8FA396',
  accentDeep: '#10B981',
  accentBright: '#34D399',
  pop: '#F59E0B',
  border: '#1D3327',
  heroText: '#FFFFFF',
  heroSubtext: 'rgba(255,255,255,0.85)',
  primaryButtonText: '#FFFFFF',
  glow: 'rgba(16,185,129,0.30)',
  amberDot: '#F59E0B',
  lowConfidence: '#F59E0B',
}

export const radii = {
  card: 20,
  hero: 22,
  button: 15,
  avatar: 12,
  avatarMini: 8,
  badge: 20,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}
