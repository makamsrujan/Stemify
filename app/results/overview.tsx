import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line } from 'react-native-svg';
import { colors, NOTES } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const W = Dimensions.get('window').width;

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    loadHistory().then(h => setRec(h.find(r => r.id === id) || null));
  }, [id]);

  if (!rec) return <View style={styles.safe}><Text style={styles.empty}>Loading…</Text></View>;

  const wh = 80;
  const ww = W - 48;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text2} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.fileName} numberOfLines={1}>{rec.fileName}</Text>

        {/* Key + BPM cards */}
        <View style={styles.row}>
          <View style={[styles.card, styles.flex]}>
            <Text style={styles.cardLabel}>KEY</Text>
            <Text style={styles.cardValue}>{rec.key}</Text>
            <Text style={styles.cardSub}>{rec.modeName} mode</Text>
            <View style={styles.confBar}>
              <View style={[styles.confFill, { width: `${rec.confidence}%`, backgroundColor: colors.green }]} />
            </View>
            <Text style={styles.confText}>{rec.confidence}% confidence</Text>
          </View>
          <View style={[styles.card, styles.flex]}>
            <Text style={styles.cardLabel}>TEMPO</Text>
            <Text style={styles.cardValue}>{rec.bpm}</Text>
            <Text style={styles.cardSub}>BPM · {rec.timeSig}</Text>
            <View style={styles.confBar}>
              <View style={[styles.confFill, { width: '80%', backgroundColor: colors.amber }]} />
            </View>
            <Text style={styles.confText}>{rec.duration > 0 ? `${Math.floor(rec.duration / 60)}:${String(Math.round(rec.duration % 60)).padStart(2,'0')}` : '—'}</Text>
          </View>
        </View>

        {/* Waveform */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WAVEFORM</Text>
          <Svg width={ww} height={wh} style={{ marginTop: 8 }}>
            <Line x1={0} y1={wh/2} x2={ww} y2={wh/2} stroke={colors.border} strokeWidth={1} />
            {rec.waveform.map((v, i) => {
              const x = (i / rec.waveform.length) * ww;
              const bw = (ww / rec.waveform.length) * 0.7;
              const bh = v * (wh / 2 - 4);
              return (
                <Rect key={i} x={x} y={wh/2 - bh} width={bw} height={bh*2}
                  rx={1} fill={colors.green} opacity={0.7} />
              );
            })}
          </Svg>
        </View>

        {/* Chromagram */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CHROMAGRAM</Text>
          <View style={styles.chromaRow}>
            {rec.chroma.map((v, i) => (
              <View key={i} style={styles.chromaCol}>
                <View style={[styles.chromaBar, { height: Math.max(4, v * 80), backgroundColor: i === rec.keyRoot ? colors.green : colors.purple }]} />
                <Text style={styles.chromaNote}>{NOTES[i]}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 8, gap: 16 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { color: colors.text2, fontSize: 15, marginLeft: 4 },
  fileName: { fontSize: 16, color: colors.text, fontWeight: '700', marginBottom: 4 },
  empty: { color: colors.text3, textAlign: 'center', marginTop: 80, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardLabel: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2 },
  cardValue: { fontSize: 30, fontWeight: '900', color: colors.text, marginTop: 4 },
  cardSub: { fontSize: 12, color: colors.text3, marginTop: 2 },
  confBar: { height: 3, backgroundColor: colors.border2, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  confFill: { height: 3, borderRadius: 2 },
  confText: { fontSize: 11, color: colors.text3, marginTop: 4 },
  chromaRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, marginTop: 12, gap: 2 },
  chromaCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  chromaBar: { width: '100%', borderRadius: 2, minHeight: 4 },
  chromaNote: { fontSize: 8, color: colors.text3, fontWeight: '600' },
});
