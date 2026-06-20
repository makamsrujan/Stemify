import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, MODES, EXOTIC_SCALES, TIME_SIGNATURES, NOTES } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TheoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);
  useEffect(() => { loadHistory().then(h => setRec(h.find(r => r.id === id) || null)); }, [id]);
  if (!rec) return <View style={s.safe}><Text style={s.empty}>Loading…</Text></View>;

  const mode = MODES.find(m => m.name === rec.modeName) || MODES[0];
  const timeSig = TIME_SIGNATURES[rec.timeSig] || TIME_SIGNATURES['4/4'];
  const relativeKey = rec.keyMode === 'major'
    ? `${NOTES[(rec.keyRoot + 9) % 12]} minor`
    : `${NOTES[(rec.keyRoot + 3) % 12]} major`;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Music Theory</Text>

        {/* Mode */}
        <View style={[s.card, { borderColor: mode.color + '44' }]}>
          <View style={s.row}>
            <View style={[s.dot, { backgroundColor: mode.color }]} />
            <Text style={[s.modeTitle, { color: mode.color }]}>{mode.name}</Text>
          </View>
          <Text style={s.modeFeel}>{mode.feel}</Text>
          <Text style={s.modeGenre}>{mode.genre}</Text>
          <View style={s.intervalsRow}>
            {mode.intervals.map((iv, i) => (
              <View key={i} style={[s.ivChip, { backgroundColor: mode.color + '22' }]}>
                <Text style={[s.ivText, { color: mode.color }]}>{iv}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scale notes */}
        <View style={s.card}>
          <Text style={s.label}>SCALE NOTES</Text>
          <View style={s.notesRow}>
            {mode.intervals.map((iv, i) => {
              const note = NOTES[(rec.keyRoot + iv) % 12];
              const active = i === 0;
              return (
                <View key={i} style={[s.noteChip, active && s.noteActive]}>
                  <Text style={[s.noteText, active && { color: colors.green }]}>{note}</Text>
                  <Text style={s.noteDeg}>{['1','2','3','4','5','6','7'][i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Relative key */}
        <View style={s.card}>
          <Text style={s.label}>RELATIVE KEY</Text>
          <Text style={s.bigText}>{relativeKey}</Text>
          <Text style={s.sub}>Shares the same notes — different tonal center</Text>
        </View>

        {/* Time signature */}
        <View style={s.card}>
          <Text style={s.label}>TIME SIGNATURE</Text>
          <View style={s.row}>
            <View style={s.timeSigBox}>
              <Text style={s.timeSigNum}>{timeSig.beats}</Text>
              <View style={s.timeSigLine} />
              <Text style={s.timeSigNum}>{timeSig.unit}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.timeFeelText}>{timeSig.feel}</Text>
              <Text style={s.timeSub}>Grouping: {timeSig.grouping}</Text>
              <Text style={s.timeSub}>e.g. {timeSig.examples}</Text>
            </View>
          </View>
        </View>

        {/* All modes reference */}
        <Text style={s.sectionTitle}>All 7 Modes</Text>
        {MODES.map(m => (
          <View key={m.name} style={[s.modeRow, m.name === rec.modeName && s.modeRowActive]}>
            <View style={[s.dot, { backgroundColor: m.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.modeName, { color: m.name === rec.modeName ? m.color : colors.text }]}>{m.name}</Text>
              <Text style={s.modeRowSub}>{m.feel}</Text>
            </View>
            {m.name === rec.modeName && <Text style={[s.badge, { backgroundColor: m.color + '22', color: m.color }]}>DETECTED</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  empty: { color: colors.text3, textAlign: 'center', marginTop: 80, fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  modeTitle: { fontSize: 22, fontWeight: '800' },
  modeFeel: { fontSize: 14, color: colors.text, marginTop: 6, fontWeight: '600' },
  modeGenre: { fontSize: 12, color: colors.text3, marginTop: 2 },
  intervalsRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  ivChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ivText: { fontSize: 12, fontWeight: '700' },
  notesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  noteChip: { alignItems: 'center', backgroundColor: colors.card2, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  noteActive: { borderColor: colors.green, backgroundColor: colors.greenDim },
  noteText: { fontSize: 14, fontWeight: '700', color: colors.text },
  noteDeg: { fontSize: 9, color: colors.text3, marginTop: 2 },
  bigText: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.text3 },
  timeSigBox: { width: 56, height: 72, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  timeSigNum: { fontSize: 28, fontWeight: '900', color: colors.green, lineHeight: 32 },
  timeSigLine: { width: 40, height: 2, backgroundColor: colors.green, marginVertical: 2 },
  timeFeelText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  timeSub: { fontSize: 11, color: colors.text3, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  modeRowActive: { borderColor: colors.green + '44' },
  modeName: { fontSize: 14, fontWeight: '700' },
  modeRowSub: { fontSize: 11, color: colors.text3, marginTop: 2 },
  badge: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, letterSpacing: 1 },
});
