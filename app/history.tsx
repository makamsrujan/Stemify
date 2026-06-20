import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { loadHistory, deleteAnalysis, AnalysisRecord } from '../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);

  useFocusEffect(useCallback(() => { loadHistory().then(setRecords); }, []));

  function confirmDelete(id: string) {
    Alert.alert('Delete', 'Remove this analysis?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAnalysis(id).then(() => loadHistory().then(setRecords)) },
    ]);
  }

  function fmtDate(ts: number) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>History</Text>
        <Text style={s.count}>{records.length} analysis{records.length !== 1 ? 'es' : ''}</Text>
      </View>
      {records.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="time-outline" size={48} color={colors.text4} />
          <Text style={s.emptyTitle}>No analyses yet</Text>
          <Text style={s.emptySub}>Pick a track from the Home tab to get started</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 24, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => router.push({ pathname: '/results/overview', params: { id: item.id } })} activeOpacity={0.8}>
              <View style={s.keyBadge}>
                <Text style={s.keyBadgeText}>{item.key.split(' ')[0]}</Text>
                <Text style={s.modeBadge}>{item.keyMode === 'major' ? 'Maj' : 'Min'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fileName} numberOfLines={1}>{item.fileName}</Text>
                <Text style={s.meta}>{item.bpm} BPM · {item.timeSig} · {fmtDate(item.timestamp)}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={18} color={colors.text4} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', padding: 24, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  count: { fontSize: 13, color: colors.text3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text2 },
  emptySub: { fontSize: 13, color: colors.text3, textAlign: 'center', maxWidth: 240 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  keyBadge: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green + '44', alignItems: 'center', justifyContent: 'center' },
  keyBadgeText: { fontSize: 16, fontWeight: '900', color: colors.green },
  modeBadge: { fontSize: 9, color: colors.green, fontWeight: '700' },
  fileName: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 11, color: colors.text3, marginTop: 3 },
});
