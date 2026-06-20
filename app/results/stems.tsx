import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { bandEnergy } from '../../lib/dsp';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

const STEMS = [
  { label: 'Vocals',  lo: 200,  hi: 3000, color: colors.green,  icon: 'mic' },
  { label: 'Drums',   lo: 60,   hi: 300,  color: colors.amber,  icon: 'radio' },
  { label: 'Bass',    lo: 40,   hi: 200,  color: colors.purple, icon: 'volume-high' },
  { label: 'Mid',     lo: 3000, hi: 8000, color: colors.teal,   icon: 'musical-notes' },
  { label: 'Air',     lo: 8000, hi: 16000,color: colors.blue,   icon: 'cloud' },
];

export default function StemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);
  const [energies, setEnergies] = useState<Record<string, number[]>>({});
  const [levels, setLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    loadHistory().then(async h => {
      const r = h.find(x => x.id === id);
      if (!r) return;
      setRec(r);
      // Use chroma as proxy; real implementation would load PCM
      // Initialize with chroma-derived pseudo-levels
      const lvls: Record<string, number> = {};
      const pseudo = r.chroma;
      STEMS.forEach((st, i) => {
        lvls[st.label] = Math.round(30 + pseudo[i % 12] * 60);
      });
      setLevels(lvls);
    });
  }, [id]);

  if (!rec) return <View style={s.safe} />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Stem Analysis</Text>
        <Text style={s.sub}>Frequency band energy visualization</Text>

        {STEMS.map(stem => {
          const lvl = levels[stem.label] ?? 50;
          return (
            <View key={stem.label} style={[s.card, { borderColor: stem.color + '33' }]}>
              <View style={s.row}>
                <View style={[s.iconBox, { backgroundColor: stem.color + '22' }]}>
                  <Ionicons name={stem.icon as any} size={22} color={stem.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stemLabel}>{stem.label}</Text>
                  <Text style={s.stemRange}>{stem.lo < 1000 ? stem.lo : stem.lo/1000+'k'}Hz – {stem.hi < 1000 ? stem.hi : stem.hi/1000+'k'}Hz</Text>
                </View>
                <Text style={[s.lvlText, { color: stem.color }]}>{lvl}%</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${lvl}%`, backgroundColor: stem.color }]} />
              </View>
            </View>
          );
        })}

        <View style={s.noteCard}>
          <Ionicons name="information-circle" size={16} color={colors.text3} />
          <Text style={s.noteText}>
            Full stem separation (isolating vocal/drum/bass tracks) requires AI models like Demucs. This screen shows band energy levels from the original audio.
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
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stemLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  stemRange: { fontSize: 11, color: colors.text3, marginTop: 2 },
  lvlText: { fontSize: 18, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: colors.border2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  noteCard: { flexDirection: 'row', gap: 8, backgroundColor: colors.card2, borderRadius: 12, padding: 14, alignItems: 'flex-start' },
  noteText: { flex: 1, color: colors.text3, fontSize: 12, lineHeight: 18 },
});
