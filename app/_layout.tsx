import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>
      <Ionicons name={name} size={22} color={focused ? colors.green : colors.text3} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.bar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="mic" focused={focused} /> }}
        />
        <Tabs.Screen
          name="history"
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} /> }}
        />
        <Tabs.Screen
          name="settings"
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="settings-sharp" focused={focused} /> }}
        />
        <Tabs.Screen name="results" options={{ href: null }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#0f0f0f',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: 'rgba(29,185,84,0.15)' },
});
