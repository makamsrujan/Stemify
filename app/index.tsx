import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { computeChroma, detectKey, detectBPM, buildWaveform, getScaleChords, getExtendedChords } from '../lib/dsp';
import { saveAnalysis } from '../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

type Phase = 'idle' | 'loading' | 'decoding' | 'analyzing';

export default function HomeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [label, setLabel] = useState('');

  async function pickAndAnalyze() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      analyze(asset.uri, asset.name || 'Unknown');
    } catch (e) {
      Alert.alert('Error', 'Could not open file.');
    }
  }

  async function analyze(uri: string, fileName: string) {
    setPhase('loading');
    setLabel('Loading audio…');
    try {
      setPhase('decoding');
      setLabel('Decoding audio…');

      // Load with expo-av to get duration info
      const { sound, status } = await Audio.Sound.createAsync({ uri });
      const dur = (status as any).durationMillis ? (status as any).durationMillis / 1000 : 0;
      await sound.unloadAsync();

      setLabel('Computing chromagram…');
      // Read raw bytes for DSP
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      // Downsample bytes to float32 PCM approximation (mono, 22050 Hz equivalent)
      const data = pcmFromBytes(bytes);
      const SR = 22050;

      setPhase('analyzing');
      setLabel('Detecting key…');
      const chroma = computeChroma(data, SR);
      const keyInfo = detectKey(chroma);

      setLabel('Detecting BPM…');
      const bpmInfo = detectBPM(data, SR);

      setLabel('Building waveform…');
      const waveform = buildWaveform(data, 300);

      const record = await saveAnalysis({
        fileName, duration: dur,
        key: `${keyInfo.name} ${keyInfo.mode === 'major' ? 'Major' : 'Minor'}`,
        keyRoot: keyInfo.root, keyMode: keyInfo.mode,
        modeName: keyInfo.modeName, bpm: bpmInfo.bpm,
        timeSig: bpmInfo.timeSig, confidence: keyInfo.confidence,
        waveform, chroma: Array.from(chroma),
      });

      setPhase('idle');
      router.push({ pathname: '/results/overview', params: { id: record.id } });
    } catch (err) {
      setPhase('idle');
      Alert.alert('Analysis failed', 'Could not analyze audio. Please try another file.');
    }
  }

  function pcmFromBytes(bytes: Uint8Array): Float32Array {
    // Skip first 44 bytes (WAV header if present) and treat remaining as int16 LE
    const start = bytes.length > 100 ? 44 : 0;
    const samples = Math.floor((bytes.length - start) / 2);
    const out = new Float32Array(Math.max(samples, 1));
    for (let i = 0; i < samples; i++) {
      const lo = bytes[start + i * 2];
      const hi = bytes[start + i * 2 + 1];
      let s = (hi << 8) | lo;
      if (s > 32767) s -= 65536;
      out[i] = s / 32768;
    }
    return out;
  }

  const busy = phase !== 'idle';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>STEMIFY</Text>
          <Text style={styles.logoSub}>PRO</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.micButton} onPress={pickAndAnalyze} disabled={busy} activeOpacity={0.8}>
            <View style={styles.micOuter}>
              <View style={styles.micInner}>
                {busy
                  ? <ActivityIndicator size="large" color={colors.green} />
                  : <Ionicons name="musical-notes" size={48} color={colors.green} />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{busy ? label : 'Drop a track'}</Text>
          <Text style={styles.heroSub}>
            {busy ? 'Analyzing your music…' : 'Pick any audio file to detect key, BPM, chords, modes, lyrics & more'}
          </Text>
        </View>

        {/* Feature chips */}
        {!busy && (
          <View style={styles.chips}>
            {FEATURES.map(f => (
              <View key={f.label} style={[styles.chip, { borderColor: f.color + '44' }]}>
                <Ionicons name={f.icon as any} size={14} color={f.color} />
                <Text style={[styles.chipText, { color: f.color }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const FEATURES = [
  { label: 'Key Detection', icon: 'key', color: colors.green },
  { label: '7 Modes', icon: 'layers', color: colors.purple },
  { label: 'BPM', icon: 'pulse', color: colors.amber },
  { label: 'Extended Chords', icon: 'musical-note', color: colors.teal },
  { label: 'Time Signatures', icon: 'timer', color: colors.blue },
  { label: 'Exotic Scales', icon: 'planet', color: colors.red },
  { label: 'Lyrics', icon: 'chatbubbles', color: colors.purple },
  { label: 'Transpose', icon: 'swap-horizontal', color: colors.green },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 48 },
  logo: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: 4 },
  logoSub: { fontSize: 11, fontWeight: '700', color: colors.green, letterSpacing: 3, marginLeft: 4, marginBottom: 2 },
  hero: { alignItems: 'center', paddingVertical: 32 },
  micButton: { marginBottom: 32 },
  micOuter: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: colors.green + '33', alignItems: 'center', justifyContent: 'center' },
  micInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green + '66', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  heroSub: { fontSize: 14, color: colors.text3, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 32, justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  chipText: { fontSize: 12, fontWeight: '600' },
});
