import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, MODES } from '../constants/theme';
import { searchSongs, SongRecord } from '../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const TIME_SIGS = ['4/4', '3/4', '6/8', '5/4', '7/8', '12/8'];
const KEYS = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [selKey, setSelKey] = useState('');
  const [selMode, setSelMode] = useState('');
  const [selSig, setSelSig] = useState('');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [results, setResults] = useState<SongRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [offline, setOffline] = useState(false);

  async function doSearch() {
    setLoading(true); setSearched(true); setOffline(false);
    try {
      const res = await searchSongs({
        q: q || undefined,
        key: selKey ? `${selKey}` : undefined,
        mode: selMode || undefined,
        time_sig: selSig || undefined,
        bpm_min: bpmMin ? parseInt(bpmMin) : undefined,
        bpm_max: bpmMax ? parseInt(bpmMax) : undefined,
      });
      setResults(res);
    } catch {
      setOffline(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setQ(''); setSelKey(''); setSelMode(''); setSelSig('');
    setBpmMin(''); setBpmMax(''); setResults([]); setSearched(false);
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        <Text style={st.title}>Search</Text>

        {/* Text search */}
        <View style={st.inputRow}>
          <Ionicons name="search" size={18} color={colors.text3} style={{ marginLeft: 12 }} />
          <TextInput style={st.input} placeholder="Song title or artist…" placeholderTextColor={colors.text3}
            value={q} onChangeText={setQ} returnKeyType="search" onSubmitEditing={doSearch} />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} style={{ marginRight: 12 }}>
              <Ionicons name="close-circle" size={18} color={colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Key filter */}
        <Text style={st.filterLabel}>KEY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={st.chipRow}>
            {KEYS.map(k => (
              <TouchableOpacity key={k} style={[st.chip, selKey === k && st.chipActive]} onPress={() => setSelKey(selKey === k ? '' : k)}>
                <Text style={[st.chipText, selKey === k && { color: colors.green }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Mode filter */}
        <Text style={st.filterLabel}>MODE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={st.chipRow}>
            {MODES.map(m => (
              <TouchableOpacity key={m.name} style={[st.chip, selMode === m.name && { borderColor: m.color, backgroundColor: m.color + '22' }]}
                onPress={() => setSelMode(selMode === m.name ? '' : m.name)}>
                <Text style={[st.chipText, selMode === m.name && { color: m.color }]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Time sig filter */}
        <Text style={st.filterLabel}>TIME SIGNATURE</Text>
        <View style={st.chipRow}>
          {TIME_SIGS.map(sig => (
            <TouchableOpacity key={sig} style={[st.chip, selSig === sig && st.chipActive]} onPress={() => setSelSig(selSig === sig ? '' : sig)}>
              <Text style={[st.chipText, selSig === sig && { color: colors.green }]}>{sig}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BPM range */}
        <Text style={st.filterLabel}>BPM RANGE</Text>
        <View style={st.bpmRow}>
          <TextInput style={st.bpmInput} placeholder="Min" placeholderTextColor={colors.text3}
            value={bpmMin} onChangeText={setBpmMin} keyboardType="numeric" />
          <Text style={st.bpmDash}>–</Text>
          <TextInput style={st.bpmInput} placeholder="Max" placeholderTextColor={colors.text3}
            value={bpmMax} onChangeText={setBpmMax} keyboardType="numeric" />
        </View>

        {/* Buttons */}
        <View style={st.btnRow}>
          <TouchableOpacity style={st.searchBtn} onPress={doSearch} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={st.searchBtnText}>Search Database</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={st.clearBtn} onPress={clearAll}>
            <Text style={st.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Offline warning */}
        {offline && (
          <View style={st.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.text3} />
            <Text style={st.offlineText}>Backend server is offline. Start the server to search your cloud database.</Text>
          </View>
        )}

        {/* Results */}
        {searched && !loading && !offline && (
          <Text style={st.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
        )}
        {results.map(song => (
          <TouchableOpacity key={song.id} style={st.resultCard}
            onPress={() => router.push({ pathname: '/results/overview', params: { id: song.id } })}>
            <View style={st.keyBadge}>
              <Text style={st.keyBadgeText}>{song.key_name.split(' ')[0]}</Text>
              <Text style={st.modeBadge}>{song.key_mode === 'major' ? 'Maj' : 'Min'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.songName} numberOfLines={1}>{song.title || song.file_name}</Text>
              {song.artist && <Text style={st.artist}>{song.artist}</Text>}
              <Text style={st.songMeta}>{song.bpm} BPM · {song.time_sig} · {song.mode_name} · {fmtDate(song.created_at)}</Text>
            </View>
            {song.stems_ready === 1 && (
              <View style={st.stemsBadge}><Text style={st.stemsBadgeText}>Stems</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 10 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 8 },
  input: { flex: 1, padding: 12, color: colors.text, fontSize: 15 },
  filterLabel: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { borderColor: colors.green, backgroundColor: colors.greenDim },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text2 },
  bpmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bpmInput: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  bpmDash: { color: colors.text3, fontSize: 18 },
  btnRow: { flexDirection: 'row', gap: 10 },
  searchBtn: { flex: 1, backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center' },
  searchBtnText: { color: colors.bg, fontSize: 15, fontWeight: '800' },
  clearBtn: { paddingHorizontal: 20, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  clearBtnText: { color: colors.text3, fontSize: 14, fontWeight: '600' },
  offlineBanner: { flexDirection: 'row', gap: 8, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border },
  offlineText: { flex: 1, color: colors.text3, fontSize: 12, lineHeight: 18 },
  resultCount: { fontSize: 13, color: colors.text3 },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  keyBadge: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green + '44', alignItems: 'center', justifyContent: 'center' },
  keyBadgeText: { fontSize: 15, fontWeight: '900', color: colors.green },
  modeBadge: { fontSize: 9, color: colors.green, fontWeight: '700' },
  songName: { fontSize: 14, fontWeight: '700', color: colors.text },
  artist: { fontSize: 12, color: colors.text3 },
  songMeta: { fontSize: 11, color: colors.text3, marginTop: 3 },
  stemsBadge: { backgroundColor: colors.purpleDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: colors.purple + '44' },
  stemsBadgeText: { fontSize: 10, fontWeight: '700', color: colors.purple },
});
