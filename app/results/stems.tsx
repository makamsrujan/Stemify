import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { getStemsStatus, getStemUrl } from '../../lib/api';
import { useAnalysis } from '../../lib/AnalysisContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEMS = [
  { key: 'vocals', label: 'Vocals',  color: colors.green,  icon: 'mic',           desc: '200Hz – 3kHz' },
  { key: 'drums',  label: 'Drums',   color: colors.amber,  icon: 'radio',         desc: '60Hz – 300Hz' },
  { key: 'bass',   label: 'Bass',    color: colors.purple, icon: 'volume-high',   desc: '40Hz – 200Hz' },
  { key: 'other',  label: 'Other',   color: colors.blue,   icon: 'musical-notes', desc: 'Remaining instruments' },
] as const;

type StemKey = typeof STEMS[number]['key'];

export default function StemsScreen() {
  const { id } = useAnalysis().record ? { id: useAnalysis().record!.id } : { id: '' };
  const { record: rec } = useAnalysis();
  const [stemsReady, setStemsReady] = useState<'pending' | 'done' | 'failed' | 'offline'>('pending');
  const [playing, setPlaying] = useState<StemKey | null>(null);
  const [loading, setLoading] = useState<StemKey | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  async function pollStatus() {
    try {
      const status = await getStemsStatus(id!);
      if (status.ready) {
        setStemsReady('done');
        return;
      }
      if (status.status === 'failed') {
        setStemsReady('failed');
        return;
      }
      // still processing — poll every 5 seconds
      pollRef.current = setInterval(async () => {
        try {
          const s = await getStemsStatus(id!);
          if (s.ready) { setStemsReady('done'); clearInterval(pollRef.current!); }
          else if (s.status === 'failed') { setStemsReady('failed'); clearInterval(pollRef.current!); }
        } catch { clearInterval(pollRef.current!); setStemsReady('offline'); }
      }, 5000);
    } catch {
      setStemsReady('offline');
    }
  }

  async function playStem(stemKey: StemKey) {
    // Audio playback requires a custom dev build — not available in Expo Go
    if (playing === stemKey) { setPlaying(null); return; }
    setPlaying(stemKey);
    setTimeout(() => setPlaying(null), 3000);
  }

  if (!rec) return <View style={s.safe} />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Stem Separation</Text>
        <Text style={s.sub}>{rec.fileName}</Text>

        {/* Status banner */}
        {stemsReady === 'pending' && (
          <View style={[s.banner, { borderColor: colors.amber + '44' }]}>
            <ActivityIndicator size="small" color={colors.amber} />
            <Text style={[s.bannerText, { color: colors.amber }]}>
              Demucs AI is separating your stems… (1–3 min)
            </Text>
          </View>
        )}
        {stemsReady === 'failed' && (
          <View style={[s.banner, { borderColor: colors.red + '44' }]}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={[s.bannerText, { color: colors.red }]}>Stem separation failed. Try re-uploading.</Text>
          </View>
        )}
        {stemsReady === 'offline' && (
          <View style={[s.banner, { borderColor: colors.border }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.text3} />
            <Text style={[s.bannerText, { color: colors.text3 }]}>
              Backend offline — start the server to use real stem separation.
            </Text>
          </View>
        )}

        {/* Stem cards */}
        {STEMS.map(stem => {
          const isPlaying = playing === stem.key;
          const isLoading = loading === stem.key;
          const canPlay = stemsReady === 'done';

          return (
            <View key={stem.key} style={[s.card, { borderColor: stem.color + '33' }]}>
              <View style={s.row}>
                <View style={[s.iconBox, { backgroundColor: stem.color + '22' }]}>
                  <Ionicons name={stem.icon as any} size={22} color={stem.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stemLabel}>{stem.label}</Text>
                  <Text style={s.stemDesc}>{stem.desc}</Text>
                </View>

                {canPlay && (
                  <TouchableOpacity
                    style={[s.playBtn, { backgroundColor: stem.color + '22', borderColor: stem.color + '55' }]}
                    onPress={() => playStem(stem.key)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <ActivityIndicator size="small" color={stem.color} />
                      : <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={stem.color} />
                    }
                  </TouchableOpacity>
                )}

                {!canPlay && (
                  <View style={[s.playBtn, { backgroundColor: colors.card2, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed" size={16} color={colors.text4} />
                  </View>
                )}
              </View>

              {/* Playing progress indicator */}
              {isPlaying && (
                <View style={s.playingBar}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View key={i} style={[s.playingDot, {
                      height: 4 + Math.random() * 16,
                      backgroundColor: stem.color,
                      opacity: 0.4 + Math.random() * 0.6,
                    }]} />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text3} />
          <Text style={s.infoText}>
            Powered by Meta's Demucs AI model running on your backend server. Each stem is a fully playable audio file — vocals, drums, bass, and everything else isolated independently.
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
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stemLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  stemDesc: { fontSize: 11, color: colors.text3, marginTop: 2 },
  playBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  playingBar: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
  playingDot: { width: 3, borderRadius: 2, flex: 1 },
  infoCard: { flexDirection: 'row', gap: 8, backgroundColor: colors.card2, borderRadius: 12, padding: 14, alignItems: 'flex-start' },
  infoText: { flex: 1, color: colors.text3, fontSize: 12, lineHeight: 18 },
});
