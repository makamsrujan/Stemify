import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, NOTES, NOTES_FLAT } from '../../constants/theme';
import { getScaleChords, transposeChord } from '../../lib/dsp';
import { useAnalysis } from '../../lib/AnalysisContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransposeScreen() {
  const { record: rec } = useAnalysis();
  const [semi, setSemi] = useState(0);
  if (!rec) return <View style={s.safe} />;

  const origRoot = rec.keyRoot;
  const newRoot = ((origRoot + semi) + 12) % 12;
  const origChords = getScaleChords(origRoot, rec.keyMode);
  const newKey = `${NOTES[newRoot]} ${rec.keyMode === 'major' ? 'Major' : 'Minor'}`;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Transpose</Text>

        {/* Key display */}
        <View style={s.card}>
          <View style={s.keyRow}>
            <View style={s.keyBox}>
              <Text style={s.keyLabel}>ORIGINAL</Text>
              <Text style={s.keyValue}>{rec.key}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.text3} />
            <View style={[s.keyBox, { alignItems: 'flex-end' }]}>
              <Text style={s.keyLabel}>TRANSPOSED</Text>
              <Text style={[s.keyValue, { color: colors.green }]}>{newKey}</Text>
            </View>
          </View>
          <Text style={s.semiText}>
            {semi === 0 ? 'No transposition' : `${semi > 0 ? '+' : ''}${semi} semitone${Math.abs(semi)!==1?'s':''}`}
          </Text>
        </View>

        {/* Semitone controls */}
        <View style={s.controls}>
          <TouchableOpacity style={s.ctrl} onPress={() => setSemi(s_ => Math.max(-11, s_ - 1))}>
            <Ionicons name="remove" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={s.semiDisplay}>
            <Text style={s.semiNum}>{semi > 0 ? '+' : ''}{semi}</Text>
            <Text style={s.semiLabel}>semitones</Text>
          </View>
          <TouchableOpacity style={s.ctrl} onPress={() => setSemi(s_ => Math.min(11, s_ + 1))}>
            <Ionicons name="add" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.resetBtn} onPress={() => setSemi(0)}>
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>

        {/* Quick keys */}
        <Text style={s.sectionTitle}>Jump to key</Text>
        <View style={s.keyGrid}>
          {NOTES.map((note, i) => {
            const diff = ((i - origRoot + 12) % 12);
            const adj = diff > 6 ? diff - 12 : diff;
            const active = i === newRoot;
            return (
              <TouchableOpacity key={i} style={[s.keyChip, active && s.keyChipActive]} onPress={() => setSemi(adj)}>
                <Text style={[s.keyChipText, active && { color: colors.green }]}>{note}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chord comparison */}
        <Text style={s.sectionTitle}>Chord Comparison</Text>
        {origChords.map((ch, i) => {
          const newName = transposeChord(ch.name, semi);
          return (
            <View key={i} style={s.chordRow}>
              <View style={s.degBadge}><Text style={s.degText}>{ch.degree}</Text></View>
              <Text style={s.origChord}>{ch.name}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.text3} style={{ marginHorizontal: 8 }} />
              <Text style={[s.newChord, semi !== 0 && { color: colors.green }]}>{newName}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  keyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  keyBox: { flex: 1 },
  keyLabel: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2 },
  keyValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  semiText: { fontSize: 12, color: colors.text3, textAlign: 'center', marginTop: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  ctrl: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  semiDisplay: { alignItems: 'center', width: 80 },
  semiNum: { fontSize: 40, fontWeight: '900', color: colors.green },
  semiLabel: { fontSize: 11, color: colors.text3, marginTop: 2 },
  resetBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  resetText: { color: colors.text3, fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  keyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyChip: { width: 52, height: 40, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyChipActive: { borderColor: colors.green, backgroundColor: colors.greenDim },
  keyChipText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
  chordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  degBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.greenDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  degText: { fontSize: 11, fontWeight: '800', color: colors.green },
  origChord: { fontSize: 16, fontWeight: '700', color: colors.text, width: 60 },
  newChord: { fontSize: 16, fontWeight: '700', color: colors.text },
});
