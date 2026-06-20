import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { clearHistory } from '../lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [flatNotes, setFlatNotes] = useState(false);
  const [haptics, setHaptics] = useState(true);

  function confirmClear() {
    Alert.alert('Clear History', 'Delete all saved analyses?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearHistory().then(() => Alert.alert('Done', 'History cleared.')) },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Settings</Text>

        <View style={s.section}>
          <Text style={s.sectionLabel}>DISPLAY</Text>
          <SettingRow icon="musical-note" label="Use flat notes (♭)" value={flatNotes} onToggle={setFlatNotes} />
          <SettingRow icon="phone-portrait" label="Haptic feedback" value={haptics} onToggle={setHaptics} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>DATA</Text>
          <TouchableOpacity style={s.dangerRow} onPress={confirmClear}>
            <Ionicons name="trash" size={18} color={colors.red} />
            <Text style={s.dangerText}>Clear all history</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ABOUT</Text>
          <View style={s.infoCard}>
            <Text style={s.appName}>STEMIFY PRO</Text>
            <Text style={s.version}>Version 1.0.0</Text>
            <Text style={s.desc}>Professional music analysis — key detection, BPM, modes, chords, lyrics, stems & more.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon as any} size={18} color={colors.text2} />
      <Text style={s.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: colors.green, false: colors.border2 }} thumbColor={colors.text} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 16, gap: 20 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 8 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.text3, letterSpacing: 2, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.redDim, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.red + '33' },
  dangerText: { fontSize: 15, color: colors.red, fontWeight: '600' },
  infoCard: { backgroundColor: colors.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 4 },
  appName: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: 3 },
  version: { fontSize: 12, color: colors.text3 },
  desc: { fontSize: 13, color: colors.text2, lineHeight: 20, marginTop: 8 },
});
