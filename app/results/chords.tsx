import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, NOTES_FLAT, EXOTIC_SCALES } from '../../constants/theme';
import { getScaleChords, getExtendedChords } from '../../lib/dsp';
import { useAnalysis } from '../../lib/AnalysisContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type View_ = 'diatonic' | 'extended' | 'exotic';

export default function ChordsScreen() {
  const { record: rec } = useAnalysis();
  const [view, setView] = useState<View_>('diatonic');
  const [selScale, setSelScale] = useState<string | null>(null);
  if (!rec) return <View style={s.safe} />;

  const diatonic = getScaleChords(rec.keyRoot, rec.keyMode);
  const extended = getExtendedChords(rec.keyRoot, rec.keyMode);

  const exoticEntries = Object.entries(EXOTIC_SCALES);
  const selScaleData = selScale ? EXOTIC_SCALES[selScale] : null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Chords</Text>
        <Text style={s.sub}>{rec.key}</Text>

        {/* Toggle */}
        <View style={s.toggle}>
          {(['diatonic','extended','exotic'] as View_[]).map(v => (
            <TouchableOpacity key={v} style={[s.toggleBtn, view===v && s.toggleActive]} onPress={() => setView(v)}>
              <Text style={[s.toggleText, view===v && s.toggleTextActive]}>{v.charAt(0).toUpperCase()+v.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {view === 'diatonic' && (
          <View style={s.section}>
            {diatonic.map((ch, i) => (
              <View key={i} style={s.chordRow}>
                <View style={s.degBadge}><Text style={s.degText}>{ch.degree}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chordName}>{ch.name}</Text>
                  <Text style={s.chordNotes}>{ch.notes.join(' – ')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {view === 'extended' && (
          <View style={s.section}>
            {extended.map((ch, i) => (
              <View key={i} style={s.chordRow}>
                <View style={[s.degBadge, { backgroundColor: colors.purpleDim, borderColor: colors.purple+'44' }]}>
                  <Text style={[s.degText, { color: colors.purple }]}>{ch.degree}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chordName}>{ch.name}</Text>
                  <Text style={s.chordNotes}>{ch.notes.join(' – ')}</Text>
                  <Text style={s.desc}>{ch.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {view === 'exotic' && (
          <View style={s.section}>
            <View style={s.exoticGrid}>
              {exoticEntries.map(([name]) => (
                <TouchableOpacity key={name} style={[s.exoticChip, selScale===name && s.exoticActive]} onPress={() => setSelScale(selScale===name ? null : name)}>
                  <Text style={[s.exoticLabel, selScale===name && { color: colors.teal }]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selScaleData && (
              <View style={[s.card, { borderColor: colors.teal+'44' }]}>
                <Text style={s.exoticTitle}>{selScale}</Text>
                <Text style={s.desc}>{selScaleData.description}</Text>
                <Text style={s.label}>SCALE NOTES</Text>
                <View style={s.notesRow}>
                  {selScaleData.intervals.map((iv, i) => (
                    <View key={i} style={[s.noteChip, i===0 && s.noteRoot]}>
                      <Text style={[s.noteText, i===0 && { color: colors.teal }]}>{NOTES_FLAT[(rec.keyRoot+iv)%12]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.text3, marginBottom: 4 },
  toggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.greenDim },
  toggleText: { fontSize: 12, fontWeight: '600', color: colors.text3 },
  toggleTextActive: { color: colors.green },
  section: { gap: 8 },
  chordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  degBadge: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green+'44', alignItems: 'center', justifyContent: 'center' },
  degText: { fontSize: 13, fontWeight: '800', color: colors.green },
  chordName: { fontSize: 18, fontWeight: '800', color: colors.text },
  chordNotes: { fontSize: 11, color: colors.text3, marginTop: 2 },
  desc: { fontSize: 11, color: colors.text3, marginTop: 4, fontStyle: 'italic' },
  exoticGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exoticChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  exoticActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  exoticLabel: { fontSize: 13, fontWeight: '600', color: colors.text2 },
  exoticTitle: { fontSize: 18, fontWeight: '800', color: colors.teal, marginBottom: 6 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, marginTop: 4 },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginTop: 12, marginBottom: 8 },
  notesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  noteChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border },
  noteRoot: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  noteText: { fontSize: 13, fontWeight: '700', color: colors.text },
});
