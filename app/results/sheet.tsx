import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, NOTES_FLAT } from '../../constants/theme';
import { getScaleChords } from '../../lib/dsp';
import { useAnalysis } from '../../lib/AnalysisContext';
import { getTranscription, Note } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const W = Dimensions.get('window').width - 48;

const MIDI_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function midiToName(midi: number) { return MIDI_NAMES[midi % 12] + Math.floor(midi / 12 - 1); }

// Piano roll: shows notes as colored bars on a time/pitch grid
function PianoRoll({ notes, duration }: { notes: Note[]; duration: number }) {
  if (notes.length === 0) return null;
  const h = 160;
  const pitches = notes.map(n => n.pitch);
  const minP = Math.max(36, Math.min(...pitches) - 2);
  const maxP = Math.min(96, Math.max(...pitches) + 2);
  const range = maxP - minP || 12;
  const dur = duration || notes[notes.length - 1]?.end || 30;

  return (
    <Svg width={W} height={h}>
      {/* Grid lines */}
      {Array.from({ length: range + 1 }).map((_, i) => (
        <Line key={i} x1={0} y1={(i / range) * h} x2={W} y2={(i / range) * h}
          stroke={colors.border} strokeWidth={0.5} />
      ))}
      {/* Notes */}
      {notes.map((n, i) => {
        const x = (n.start / dur) * W;
        const noteW = Math.max(3, ((n.end - n.start) / dur) * W);
        const y = ((maxP - n.pitch) / range) * h;
        const noteH = Math.max(3, h / range - 1);
        const isBlack = [1,3,6,8,10].includes(n.pitch % 12);
        return (
          <Rect key={i} x={x} y={y} width={noteW} height={noteH}
            rx={2} fill={isBlack ? colors.purple : colors.green} opacity={n.confidence} />
        );
      })}
    </Svg>
  );
}

// Staff: renders first few notes on a 5-line staff
function StaffView({ notes }: { notes: Note[] }) {
  const staffNotes = notes.slice(0, 16);
  const sy = (line: number) => 20 + line * 10;

  return (
    <Svg width={W} height={90}>
      {[0,1,2,3,4].map(l => (
        <Line key={l} x1={40} y1={sy(l)} x2={W-8} y2={sy(l)} stroke={colors.border2} strokeWidth={1} />
      ))}
      <SvgText x={8} y={58} fill={colors.text2} fontSize={44}>𝄞</SvgText>
      {staffNotes.map((n, i) => {
        const octave = Math.floor(n.pitch / 12) - 1;
        const step = n.pitch % 12;
        const staffPos = (84 - n.pitch) / 2;
        const x = 48 + i * ((W - 56) / 16);
        const y = 20 + staffPos * 5;
        const isBlack = [1,3,6,8,10].includes(step);
        return (
          <React.Fragment key={i}>
            <Circle cx={x} cy={y} r={5}
              fill={isBlack ? colors.purple : colors.green} />
            {isBlack && (
              <SvgText x={x - 7} y={y + 4} fill={colors.purple} fontSize={10} fontWeight="bold">♯</SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function SheetScreen() {
  const { record: rec } = useAnalysis();
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'offline'>('idle');
  const [view, setView] = useState<'staff' | 'piano' | 'chords'>('chords');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!rec) return;
    // Check if transcription already exists
    getTranscription(rec.id).then(res => {
      if (res.status === 'done' && res.notes.length > 0) {
        setNotes(res.notes); setStatus('done');
      }
    }).catch(() => setStatus('offline'));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rec?.id]);

  function startPolling() {
    if (!rec) return;
    setStatus('processing');
    pollRef.current = setInterval(async () => {
      try {
        const res = await getTranscription(rec.id);
        if (res.status === 'done') {
          setNotes(res.notes);
          setStatus('done');
          clearInterval(pollRef.current!);
        }
      } catch { clearInterval(pollRef.current!); setStatus('offline'); }
    }, 4000);
  }

  if (!rec) return <View style={s.safe} />;

  const chords = getScaleChords(rec.keyRoot, rec.keyMode);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Sheet Music</Text>
        <Text style={s.sub}>{rec.key}</Text>

        {/* View toggle */}
        <View style={s.toggle}>
          {(['chords','staff','piano'] as const).map(v => (
            <TouchableOpacity key={v} style={[s.toggleBtn, view===v && s.toggleActive]} onPress={() => setView(v)}>
              <Text style={[s.toggleText, view===v && s.toggleTextActive]}>
                {v === 'chords' ? 'Chord Chart' : v === 'staff' ? 'Staff' : 'Piano Roll'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transcription status */}
        {(view === 'staff' || view === 'piano') && status === 'idle' && (
          <View style={s.card}>
            <Text style={s.infoTitle}>AI Transcription</Text>
            <Text style={s.infoText}>
              Upload your audio to generate note-for-note sheet music using Basic Pitch AI by Spotify.
            </Text>
            <TouchableOpacity style={s.btn} onPress={startPolling}>
              <Text style={s.btnText}>Load Transcription</Text>
            </TouchableOpacity>
          </View>
        )}

        {(view === 'staff' || view === 'piano') && status === 'processing' && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <ActivityIndicator color={colors.green} />
            <Text style={s.infoText}>Basic Pitch AI is transcribing your audio… (1–2 min)</Text>
          </View>
        )}

        {(view === 'staff' || view === 'piano') && status === 'offline' && (
          <View style={[s.card, { borderColor: colors.border }]}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.text3} />
            <Text style={s.infoText}>Backend offline. Start the server to use AI transcription.</Text>
          </View>
        )}

        {/* Staff view */}
        {view === 'staff' && status === 'done' && notes.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>STAFF NOTATION (first 16 notes)</Text>
            <StaffView notes={notes} />
            <Text style={s.noteCount}>{notes.length} notes detected total</Text>
          </View>
        )}

        {/* Piano roll */}
        {view === 'piano' && status === 'done' && notes.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>PIANO ROLL</Text>
            <PianoRoll notes={notes} duration={notes[notes.length-1]?.end || 30} />
            <Text style={s.noteCount}>{notes.length} notes · {Math.round(notes[notes.length-1]?.end || 0)}s</Text>
          </View>
        )}

        {/* Chord chart — always available */}
        {view === 'chords' && (
          <>
            {/* Chromagram piano */}
            <View style={s.card}>
              <Text style={s.label}>CHROMAGRAM — ACTIVE NOTES</Text>
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
                      <View key={j} style={[s.noteChip, j===0 && s.noteRoot]}>
                        <Text style={[s.noteText, j===0 && { color: colors.green }]}>{n}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
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
  sub: { fontSize: 13, color: colors.text3, marginBottom: 4 },
  toggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.greenDim },
  toggleText: { fontSize: 11, fontWeight: '600', color: colors.text3 },
  toggleTextActive: { color: colors.green },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  infoText: { fontSize: 13, color: colors.text2, lineHeight: 20 },
  btn: { backgroundColor: colors.green, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: colors.bg, fontSize: 14, fontWeight: '800' },
  noteCount: { fontSize: 11, color: colors.text3, textAlign: 'center' },
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
});
