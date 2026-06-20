import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors, TIME_SIGNATURES } from '../../constants/theme';
import { loadHistory, AnalysisRecord } from '../../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const W = Dimensions.get('window').width - 48;

function BeatGrid({ beats, grouping }: { beats: number; grouping: string }) {
  const groups = grouping.split('+').map(Number);
  const cellW = (W - 24) / beats;
  let gi = 0; let gInner = 0;
  return (
    <Svg width={W} height={60}>
      {Array.from({ length: beats }).map((_, i) => {
        if (gInner >= groups[gi]) { gi++; gInner = 0; }
        const isFirst = gInner === 0;
        const x = 12 + i * cellW;
        gInner++;
        return (
          <React.Fragment key={i}>
            <Circle cx={x + cellW/2} cy={30} r={isFirst ? 14 : 10}
              fill={isFirst ? colors.green : colors.card2}
              stroke={isFirst ? colors.green : colors.border2}
              strokeWidth={1} />
            <SvgText x={x + cellW/2} y={35} fill={isFirst ? colors.bg : colors.text3}
              fontSize={isFirst ? 12 : 10} textAnchor="middle" fontWeight="bold">
              {i+1}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function MeterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rec, setRec] = useState<AnalysisRecord | null>(null);
  useEffect(() => { loadHistory().then(h => setRec(h.find(r => r.id === id) || null)); }, [id]);
  if (!rec) return <View style={s.safe} />;

  const ts = TIME_SIGNATURES[rec.timeSig] || TIME_SIGNATURES['4/4'];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Time Signature</Text>

        {/* Big display */}
        <View style={s.sigCard}>
          <View style={s.sigBox}>
            <Text style={s.sigNum}>{ts.beats}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigNum}>{ts.unit}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.feel}>{ts.feel}</Text>
            <Text style={s.meta}>Grouping: {ts.grouping}</Text>
            <Text style={s.meta}>e.g. {ts.examples}</Text>
          </View>
        </View>

        {/* Beat grid */}
        <View style={s.card}>
          <Text style={s.label}>BEAT PATTERN</Text>
          <BeatGrid beats={ts.beats} grouping={ts.grouping} />
          <Text style={s.beatHelp}>Large = downbeat. Groups: {ts.grouping}</Text>
        </View>

        {/* All signatures */}
        <Text style={s.sectionTitle}>All Time Signatures</Text>
        {Object.entries(TIME_SIGNATURES).map(([sig, info]) => (
          <View key={sig} style={[s.sigRow, sig === rec.timeSig && s.sigRowActive]}>
            <View style={s.miniSigBox}>
              <Text style={s.miniSigNum}>{info.beats}</Text>
              <View style={s.miniSigLine} />
              <Text style={s.miniSigNum}>{info.unit}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sigLabel, sig === rec.timeSig && { color: colors.green }]}>{sig}</Text>
              <Text style={s.sigFeelText}>{info.feel}</Text>
            </View>
            {sig === rec.timeSig && (
              <View style={s.badge}><Text style={s.badgeText}>DETECTED</Text></View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sigCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.green + '33' },
  sigBox: { width: 64, alignItems: 'center' },
  sigNum: { fontSize: 32, fontWeight: '900', color: colors.green, lineHeight: 36 },
  sigLine: { width: 48, height: 2, backgroundColor: colors.green, marginVertical: 3 },
  feel: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 11, color: colors.text3, marginTop: 3 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginBottom: 8 },
  beatHelp: { fontSize: 11, color: colors.text3, textAlign: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  sigRowActive: { borderColor: colors.green + '44' },
  miniSigBox: { width: 40, alignItems: 'center' },
  miniSigNum: { fontSize: 16, fontWeight: '900', color: colors.text2, lineHeight: 18 },
  miniSigLine: { width: 28, height: 1.5, backgroundColor: colors.text3, marginVertical: 1 },
  sigLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  sigFeelText: { fontSize: 11, color: colors.text3, marginTop: 2 },
  badge: { backgroundColor: colors.greenDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.green, letterSpacing: 1 },
});
