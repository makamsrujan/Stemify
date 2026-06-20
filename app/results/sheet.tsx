import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Line, Circle, Text as SvgText, Rect, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, NOTES_FLAT } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { getScaleChords } from '../../lib/dsp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const W = Dimensions.get('window').width - 48;

function StaffNotation({ root, mode, chroma }: { root: number; mode: string; chroma: number[] }) {
  const lines = [0, 1, 2, 3, 4];
  const sy = (line: number) => 20 + line * 10;
  // Show scale notes on staff
  const intervals = mode === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
  const staffNotes = intervals.map((iv, i) => ({
    pc: (root + iv) % 12,
    x: 60 + i * 30,
    y: 60 - i * 5,
    name: NOTES_FLAT[(root + iv) % 12],
  }));

  return (
    <Svg width={W} height={100}>
      {/* Staff lines */}
      {lines.map(l => <Line key={l} x1={16} y1={sy(l)} x2={W-16} y2={sy(l)} stroke={colors.border2} strokeWidth={1} />)}
      {/* Treble clef placeholder */}
      <SvgText x={20} y={52} fill={colors.text2} fontSize={40} fontWeight="bold">𝄞</SvgText>
      {/* Notes */}
      {staffNotes.map((n, i) => (
        <React.Fragment key={i}>
          <Circle cx={n.x} cy={n.y} r={5} fill={i === 0 ? colors.green : colors.purple} />
          <SvgText x={n.x - 5} y={n.y + 18} fill={colors.text3} fontSize={8}>{n.name}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

export default function SheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);
  useEffect(() => { loadHistory().then(h => setRec(h.find(r => r.id === id) || null)); }, [id]);
  if (!rec) return <View style={s.safe} />;

  const chords = getScaleChords(rec.keyRoot, rec.keyMode);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Sheet Music</Text>
        <Text style={s.sub}>{rec.key}</Text>

        {/* Staff notation */}
        <View style={s.card}>
          <Text style={s.label}>SCALE ON STAFF</Text>
          <StaffNotation root={rec.keyRoot} mode={rec.keyMode} chroma={rec.chroma} />
        </View>

        {/* Piano roll */}
        <View style={s.card}>
          <Text style={s.label}>PIANO ROLL (Chromagram)</Text>
          <View style={s.pianoRoll}>
            {rec.chroma.map((v, i) => {
              const isBlack = [1,3,6,8,10].includes(i);
              const active = v > 0.5;
              return (
                <View key={i} style={[
                  s.pianoKey,
                  isBlack ? s.blackKey : s.whiteKey,
                  active && { backgroundColor: i === rec.keyRoot ? colors.green : colors.purple },
                ]}>
                  {!isBlack && <Text style={[s.keyNote, active && { color: colors.bg }]}>{NOTES_FLAT[i]}</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Chord chart */}
        <View style={s.card}>
          <Text style={s.label}>CHORD TONES</Text>
          {chords.map((ch, i) => (
            <View key={i} style={s.chordLine}>
              <Text style={s.chDeg}>{ch.degree}</Text>
              <Text style={s.chName}>{ch.name}</Text>
              <View style={s.chNotes}>
                {ch.notes.map((n, j) => (
                  <View key={j} style={[s.noteChip, j === 0 && s.noteRoot]}>
                    <Text style={[s.noteText, j === 0 && { color: colors.green }]}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* AMT note */}
        <View style={s.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text3} />
          <Text style={s.noteCardText}>
            Full transcription (note-for-note from audio) requires an AI transcription service like Basic Pitch by Spotify. This screen shows the scale and chord structure of the detected key.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.text3, marginBottom: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginBottom: 10 },
  pianoRoll: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 2, paddingHorizontal: 4 },
  pianoKey: { flex: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  whiteKey: { height: 80, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
  blackKey: { height: 55, backgroundColor: '#2a2a2a', marginHorizontal: -3, zIndex: 1 },
  keyNote: { fontSize: 8, fontWeight: '700', color: colors.text3 },
  chordLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  chDeg: { width: 36, fontSize: 12, fontWeight: '800', color: colors.green },
  chName: { width: 56, fontSize: 15, fontWeight: '700', color: colors.text },
  chNotes: { flexDirection: 'row', gap: 4, flex: 1 },
  noteChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border },
  noteRoot: { borderColor: colors.green, backgroundColor: colors.greenDim },
  noteText: { fontSize: 11, fontWeight: '700', color: colors.text2 },
  noteCard: { flexDirection: 'row', gap: 8, backgroundColor: colors.card2, borderRadius: 12, padding: 14, alignItems: 'flex-start' },
  noteCardText: { flex: 1, color: colors.text3, fontSize: 12, lineHeight: 18 },
});
