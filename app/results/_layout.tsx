import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const TABS = [
  { name: 'overview',  icon: 'home',            label: 'Overview' },
  { name: 'theory',   icon: 'layers',           label: 'Theory'   },
  { name: 'chords',   icon: 'musical-note',     label: 'Chords'   },
  { name: 'lyrics',   icon: 'chatbubbles',      label: 'Lyrics'   },
  { name: 'stems',    icon: 'git-branch',       label: 'Stems'    },
  { name: 'sheet',    icon: 'document-text',    label: 'Sheet'    },
  { name: 'transpose',icon: 'swap-horizontal',  label: 'Transpose'},
];

export default function ResultsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.text3,
        tabBarItemStyle: styles.item,
      }}
    >
      {TABS.map(t => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            tabBarLabel: t.label,
            tabBarIcon: ({ color }) => <Ionicons name={t.icon as any} size={18} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#0f0f0f',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 12,
  },
  label: { fontSize: 9, fontWeight: '600' },
  item: { paddingTop: 4 },
});
