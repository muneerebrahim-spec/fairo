import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '../theme/ThemeContext'
import type { RootStackParamList } from './types'
import { HomeScreen } from '../screens/HomeScreen'
import { CaptureScreen } from '../screens/CaptureScreen'
import { ProcessingScreen } from '../screens/ProcessingScreen'
import { CorrectionModeScreen } from '../screens/CorrectionModeScreen'
import { ReviewStepThroughScreen } from '../screens/ReviewStepThroughScreen'
import { ReviewFullListScreen } from '../screens/ReviewFullListScreen'
import { AdjustmentPromptScreen } from '../screens/AdjustmentPromptScreen'
import { ParticipantsScreen } from '../screens/ParticipantsScreen'
import { SplitModeScreen } from '../screens/SplitModeScreen'
import { AssignItemsScreen } from '../screens/AssignItemsScreen'
import { ReconciliationScreen } from '../screens/ReconciliationScreen'
import { TipScreen } from '../screens/TipScreen'
import { SummaryScreen } from '../screens/SummaryScreen'
import { PercentageSplitScreen } from '../screens/PercentageSplitScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { colors, scheme } = useTheme()

  const navTheme =
    scheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.card,
            text: colors.textPrimary,
            border: colors.border,
            primary: colors.accentBright,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.card,
            text: colors.textPrimary,
            border: colors.border,
            primary: colors.accentDeep,
          },
        }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'New Split' }} />
        <Stack.Screen name="Processing" component={ProcessingScreen} options={{ title: 'Processing' }} />
        <Stack.Screen name="CorrectionMode" component={CorrectionModeScreen} options={{ title: 'Review mode' }} />
        <Stack.Screen name="ReviewStepThrough" component={ReviewStepThroughScreen} options={{ title: 'Review item' }} />
        <Stack.Screen name="ReviewFullList" component={ReviewFullListScreen} options={{ title: 'Review items' }} />
        <Stack.Screen name="AdjustmentPrompt" component={AdjustmentPromptScreen} options={{ title: 'Adjustment' }} />
        <Stack.Screen name="Participants" component={ParticipantsScreen} options={{ title: 'Participants' }} />
        <Stack.Screen name="SplitMode" component={SplitModeScreen} options={{ title: 'Split mode' }} />
        <Stack.Screen name="AssignItems" component={AssignItemsScreen} options={{ title: 'Assign items' }} />
        <Stack.Screen name="Reconciliation" component={ReconciliationScreen} options={{ title: 'Reconcile' }} />
        <Stack.Screen name="Tip" component={TipScreen} options={{ title: 'Tip' }} />
        <Stack.Screen name="PercentageSplit" component={PercentageSplitScreen} options={{ title: 'Percentages' }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'Summary' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
