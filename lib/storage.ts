import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  fileName: string;
  duration: number;
  key: string;
  keyRoot: number;
  keyMode: string;
  modeName: string;
  bpm: number;
  timeSig: string;
  confidence: number;
  waveform: number[];
  chroma: number[];
  lyrics?: string;
  title?: string;
  artist?: string;
}

const KEY = 'stemify_history';

export async function saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'timestamp'>): Promise<AnalysisRecord> {
  const full: AnalysisRecord = { ...record, id: Date.now().toString(36), timestamp: Date.now() };
  const raw = await AsyncStorage.getItem(KEY);
  const list: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
  list.unshift(full);
  if (list.length > 50) list.splice(50);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return full;
}

export async function loadHistory(): Promise<AnalysisRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteAnalysis(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return;
  const list: AnalysisRecord[] = JSON.parse(raw);
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter(r => r.id !== id)));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
