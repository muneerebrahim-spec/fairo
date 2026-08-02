import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Card, SectionTitle } from '../components/Card'
import {
  AVATAR_COLORS,
  createId,
  type SplitParticipant,
} from '../models/types'
import type { RootStackParamList } from '../navigation/types'
import { useSplitStore } from '../store/splitStore'
import { useTheme } from '../theme/ThemeContext'
import { spacing } from '../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Participants'>

export function ParticipantsScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { activeSplit, updateSplit, savedPeople, upsertSavedPerson } =
    useSplitStore()
  const [name, setName] = useState('')

  if (!activeSplit) return null

  const addParticipant = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const personId = createId()
    const color = AVATAR_COLORS[activeSplit.participants.length % AVATAR_COLORS.length]
    const participant: SplitParticipant = {
      id: createId(),
      personOrHouseholdId: personId,
      displayName: trimmed,
      isHousehold: false,
      avatarColor: color,
    }
    updateSplit({
      participants: [...activeSplit.participants, participant],
    })
    upsertSavedPerson({
      id: personId,
      name: trimmed,
      avatarColor: color,
    })
    setName('')
  }

  const addSaved = (person: (typeof savedPeople)[0]) => {
    if (
      activeSplit.participants.some(
        (p) => p.personOrHouseholdId === person.id,
      )
    )
      return
    updateSplit({
      participants: [
        ...activeSplit.participants,
        {
          id: createId(),
          personOrHouseholdId: person.id,
          displayName: person.name,
          isHousehold: false,
          avatarColor: person.avatarColor,
        },
      ],
    })
  }

  const removeParticipant = (id: string) => {
    updateSplit({
      participants: activeSplit.participants.filter((p) => p.id !== id),
    })
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Who's splitting?"
          subtitle="Add people or pick from saved contacts."
        />

        <View style={styles.inputRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onSubmitEditing={addParticipant}
          />
          <Button label="Add" onPress={addParticipant} style={styles.addBtn} />
        </View>

        <View style={styles.participantRow}>
          {activeSplit.participants.map((p) => (
            <Pressable
              key={p.id}
              onLongPress={() => removeParticipant(p.id)}
              style={styles.participantTile}
            >
              <Avatar label={p.displayName} color={p.avatarColor} />
              <Text
                style={[styles.participantName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {p.displayName}
              </Text>
            </Pressable>
          ))}
        </View>

        {savedPeople.length > 0 && (
          <>
            <Text style={[styles.savedLabel, { color: colors.textSecondary }]}>
              Saved people
            </Text>
            <View style={styles.participantRow}>
              {savedPeople.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => addSaved(p)}
                  style={styles.participantTile}
                >
                  <Avatar label={p.name} color={p.avatarColor} />
                  <Text
                    style={[styles.participantName, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Button
          label="Continue"
          disabled={activeSplit.participants.length === 0}
          onPress={() => navigation.navigate('SplitMode')}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addBtn: {
    minWidth: 80,
  },
  participantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  participantTile: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  savedLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
})
