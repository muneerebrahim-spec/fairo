import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import { LineItemRow } from '../components/LineItemRow'
import { createId } from '../models/types'
import type { RootStackParamList } from '../navigation/types'
import {
  activeItems,
  reconcile,
  toggleItemAssignment,
} from '../services/reconciliation'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'AssignItems'>

export function AssignItemsScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const {
    activeSplit,
    updateSplit,
    selectedItemId,
    setSelectedItemId,
    setActiveSplit,
  } = useSplitStore()

  const items = useMemo(
    () => (activeSplit ? activeItems(activeSplit.items) : []),
    [activeSplit],
  )

  if (!activeSplit) return null

  const selectedId = selectedItemId ?? items.find((i) => i.assignedShares.length === 0)?.id ?? items[0]?.id

  const handleItemPress = (id: string) => {
    setSelectedItemId(id)
  }

  const handleParticipantPress = (participantId: string) => {
    if (!selectedId) return
    const updated = toggleItemAssignment(activeSplit, selectedId, participantId)
    setActiveSplit(updated)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const addManualItem = () => {
    const newItem = {
      id: createId(),
      name: 'New item',
      unitPrice: 0,
      quantity: 1,
      lineTotal: 0,
      source: 'manual' as const,
      isDisregarded: false,
      assignedShares: [],
    }
    updateSplit({ items: [...activeSplit.items, newItem] })
    setSelectedItemId(newItem.id)
  }

  const continueNext = () => {
    const status = reconcile(activeSplit)
    const next = { ...activeSplit, reconciliationStatus: status, status: 'reconciling' as const }
    setActiveSplit(next)
    if (status.type === 'balanced') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
      navigation.navigate('Tip')
    } else {
      navigation.navigate('Reconciliation')
    }
  }

  const unassignedCount = items.filter((i) => i.assignedShares.length === 0).length

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          <SectionTitle
            title="Assign items"
            subtitle={
              unassignedCount > 0
                ? `${unassignedCount} item${unassignedCount === 1 ? '' : 's'} still unassigned`
                : 'Tap an item, then tap people to assign.'
            }
          />

          {items.map((item) => (
            <LineItemRow
              key={item.id}
              item={item}
              split={activeSplit}
              selected={item.id === selectedId}
              onPress={() => handleItemPress(item.id)}
            />
          ))}

          <Button
            label="+ Add Item"
            variant="secondary"
            onPress={addManualItem}
            style={styles.addItem}
          />
        </ScrollView>

        <View
          style={[
            styles.participantBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
            {selectedId ? 'Assign to' : 'Select an item'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarRow}
          >
            {activeSplit.participants.map((p) => {
              const selectedItem = activeSplit.items.find((i) => i.id === selectedId)
              const isAssigned = selectedItem?.assignedShares.some(
                (s) => s.participantId === p.id,
              )
              return (
                <View key={p.id} style={styles.avatarTile}>
                  <Avatar
                    label={p.displayName}
                    color={p.avatarColor}
                    selected={!!isAssigned}
                    onPress={() => handleParticipantPress(p.id)}
                  />
                  <Text
                    style={[styles.avatarName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {p.displayName}
                  </Text>
                </View>
              )
            })}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <Button label="Continue" onPress={continueNext} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  list: { flex: 1 },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  addItem: {
    marginTop: spacing.sm,
  },
  participantBar: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  avatarRow: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  avatarTile: {
    alignItems: 'center',
    width: 64,
    gap: 6,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
})
