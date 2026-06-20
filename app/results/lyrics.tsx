import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { fetchLyrics, LyricsResult } from '../../lib/lyrics';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LyricsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);
  const [result, setResult] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [tried, setTried] = useState(false);

  useEffect(() => { loadHistory().then(h => setRec(h.find(r => r.id === id) || null)); }, [id]);

  async function doFetch() {
    if (!rec) return;
    setLoading(true); setTried(true);
    const r = await fetchLyrics(rec.fileName, manualTitle || undefined, manualArtist || undefined);
    setResult(r);
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Lyrics</Text>

        {/* Manual entry */}
        <View style={s.card}>
          <Text style={s.label}>SONG DETAILS (optional)</Text>
          <TextInput style={s.input} placeholder="Song title…" placeholderTextColor={colors.text3}
            value={manualTitle} onChangeText={setManualTitle} />
          <TextInput style={s.input} placeholder="Artist…" placeholderTextColor={colors.text3}
            value={manualArtist} onChangeText={setManualArtist} />
          <TouchableOpacity style={s.btn} onPress={doFetch} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={s.btnText}>Fetch Lyrics</Text>}
          </TouchableOpacity>
        </View>

        {tried && !loading && !result && (
          <View style={s.card}>
            <Text style={s.empty}>No lyrics found. Try entering the song title and artist manually above.</Text>
          </View>
        )}

        {result && (
          <>
            <View style={[s.card, s.metaCard]}>
              <Text style={s.trackTitle}>{result.title}</Text>
              <Text style={s.artist}>{result.artist}</Text>
              <View style={[s.sourceBadge, { backgroundColor: colors.greenDim }]}>
                <Text style={[s.sourceText, { color: colors.green }]}>{result.source}</Text>
              </View>
              {result.synced && (
                <View style={[s.sourceBadge, { backgroundColor: colors.purpleDim, marginLeft: 6 }]}>
                  <Text style={[s.sourceText, { color: colors.purple }]}>Synced</Text>
                </View>
              )}
            </View>
            <View style={s.card}>
              <Text style={s.lyrics}>{result.lyrics}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginBottom: 10 },
  input: { backgroundColor: colors.card2, borderRadius: 10, padding: 12, color: colors.text, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  btn: { backgroundColor: colors.green, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: colors.bg, fontSize: 15, fontWeight: '800' },
  empty: { color: colors.text3, textAlign: 'center', lineHeight: 22 },
  metaCard: { gap: 4 },
  trackTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  artist: { fontSize: 14, color: colors.text3 },
  sourceBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  sourceText: { fontSize: 11, fontWeight: '700' },
  lyrics: { color: colors.text2, fontSize: 14, lineHeight: 26 },
});
