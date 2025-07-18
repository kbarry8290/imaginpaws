import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { Wand2, Image, Crown, Settings } from 'lucide-react-native';

export default function TabLayout() {
  console.log('TabLayout (tabs/_layout.tsx) rendered');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholderText,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="transform"
        options={{
          title: 'Transform',
          tabBarIcon: ({ color }) => <Wand2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color }) => <Image size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pro"
        options={{
          title: 'Credits',
          tabBarIcon: ({ color }) => <Crown size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}