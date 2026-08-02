import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import type { RootStackParamList } from '../navigation/types'
import { SAMPLE_RECEIPT_TEXT } from '../services/receiptParser'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>

export function CaptureScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { addReceiptImage, processReceiptText } = useSplitStore()
  const [loading, setLoading] = useState(false)

  const runOcrFlow = async (uris: string[]) => {
    setLoading(true)
    uris.forEach(addReceiptImage)
    navigation.navigate('Processing')
    await new Promise((r) => setTimeout(r, 1200))
    processReceiptText(SAMPLE_RECEIPT_TEXT)
    setLoading(false)
    navigation.replace('CorrectionMode')
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    })
    if (!result.canceled && result.assets.length > 0) {
      await runOcrFlow(result.assets.map((a) => a.uri))
    }
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchCameraAsync({ quality: 1 })
    if (!result.canceled && result.assets[0]) {
      await runOcrFlow([result.assets[0].uri])
    }
  }

  const useSample = async () => {
    await runOcrFlow([])
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        <SectionTitle
          title="Scan receipt"
          subtitle="Capture one or more photos of your receipt. Long receipts can use multiple shots."
        />

        <Card>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accentBright} size="large" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Reading receipt…
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Button label="Take Photo" onPress={takePhoto} />
              <Button
                label="Choose from Library"
                variant="secondary"
                onPress={pickImages}
              />
              <Button
                label="Use Sample Receipt"
                variant="secondary"
                onPress={useSample}
              />
            </View>
          )}
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
  },
  actions: {
    gap: spacing.md,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 15,
  },
})
