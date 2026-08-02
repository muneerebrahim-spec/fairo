import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { colors } from '../theme'

interface PeopleListProps {
  people: { id: string; name: string }[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
}

export function PeopleList({ people, onAdd, onRemove }: PeopleListProps) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>People</Text>
      <Text style={styles.subtitle}>Add everyone sharing the bill.</Text>

      <View style={styles.row}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={colors.textLight}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Pressable style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      {people.length === 0 ? (
        <Text style={styles.empty}>No people added yet.</Text>
      ) : (
        people.map((person) => (
          <View key={person.id} style={styles.listItem}>
            <Text style={styles.listItemText}>{person.name}</Text>
            <Pressable onPress={() => onRemove(person.id)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  empty: {
    fontSize: 14,
    color: colors.textLight,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  remove: {
    fontSize: 13,
    color: colors.textLight,
  },
})
