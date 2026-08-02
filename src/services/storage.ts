import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SavedHousehold, SavedPerson, Split } from '../models/types'

const SPLITS_KEY = '@fairo/splits'
const PEOPLE_KEY = '@fairo/people'
const HOUSEHOLDS_KEY = '@fairo/households'

export async function loadHistory(): Promise<Split[]> {
  const raw = await AsyncStorage.getItem(SPLITS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as Split[]
}

export async function saveSplitToHistory(split: Split): Promise<void> {
  const history = await loadHistory()
  const updated = [{ ...split, savedToHistory: true }, ...history.filter((s) => s.id !== split.id)]
  await AsyncStorage.setItem(SPLITS_KEY, JSON.stringify(updated))
}

export async function deleteSplitFromHistory(id: string): Promise<void> {
  const history = await loadHistory()
  await AsyncStorage.setItem(
    SPLITS_KEY,
    JSON.stringify(history.filter((s) => s.id !== id)),
  )
}

export async function loadSavedPeople(): Promise<SavedPerson[]> {
  const raw = await AsyncStorage.getItem(PEOPLE_KEY)
  if (!raw) return []
  return JSON.parse(raw) as SavedPerson[]
}

export async function saveSavedPeople(people: SavedPerson[]): Promise<void> {
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people))
}

export async function loadSavedHouseholds(): Promise<SavedHousehold[]> {
  const raw = await AsyncStorage.getItem(HOUSEHOLDS_KEY)
  if (!raw) return []
  return JSON.parse(raw) as SavedHousehold[]
}

export async function saveSavedHouseholds(
  households: SavedHousehold[],
): Promise<void> {
  await AsyncStorage.setItem(HOUSEHOLDS_KEY, JSON.stringify(households))
}
