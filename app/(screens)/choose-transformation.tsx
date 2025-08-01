import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Wand2, Image as ImageIcon, Crown, Cog, Sparkles, PawPrint, Lightbulb } from 'lucide-react-native';

const gallery = [
  {
    img: require('@/assets/images/dog_retro.jpg'),
    label: 'Retro Pup',
  },
  {
    img: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=facearea&w=256&h=256&facepad=3&q=80',
    label: 'Humanized Pet',
  },
  {
    img: 'https://images.unsplash.com/photo-1518715308788-3005759c61ba?auto=format&fit=facearea&w=256&h=256&facepad=3&q=80',
    label: 'Flower Crown',
  },
];

export default function ImaginPawsHome() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handlePetToPerson = () => {
    router.push('/(screens)/pet-to-person' as any);
  };

  const handlePetPortrait = () => {
    router.push('/(screens)/pet-portrait' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Subtle paw print bg */}
      <View style={styles.pawBg} pointerEvents="none">
        {/* Could use SVG or image for more detail */}
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header + mascot */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headline, { color: colors.text }]}>Welcome to ImaginPaws!</Text>
            <Text style={[styles.tagline, { color: colors.placeholderText }]}>Turn your pet into art or a human lookalike.</Text>
          </View>
          <Image
            source={require('@/assets/images/appicon.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>


        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.actionsTitle, { color: colors.text }]}>What would you like to create?</Text>

          {/* Pet to Person Card */}
          <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
            <Image
              source={require('@/assets/images/kittentogirl.png')}
              style={styles.actionCardImg}
              resizeMode="cover"
            />
            <Button
              title="Pet to Person"
              onPress={handlePetToPerson}
              icon={<Wand2 size={28} color="white" />}
              style={[styles.actionCardButton, { backgroundColor: colors.primary }]}
              textStyle={styles.actionCardButtonText}
            />
          </View>

          {/* Pet Portrait Card */}
          <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
            <Image
              source={require('@/assets/images/dog_retro.jpg')}
              style={styles.actionCardImg}
              resizeMode="cover"
            />
            <Button
              title="Pet Portrait"
              onPress={handlePetPortrait}
              icon={<ImageIcon size={28} color="white" />}
              style={[styles.actionCardButton, { backgroundColor: colors.primary }]}
              textStyle={styles.actionCardButtonText}
            />
          </View>

          {/* Daily idea */}
          <View style={[styles.dailyIdea, { backgroundColor: colors.cardBackground }]}>
            <Lightbulb color={colors.accent} size={22} style={{ marginRight: 8 }} />
            <Text style={[styles.dailyIdeaText, { color: colors.text }]}><Text style={{ fontWeight: 'bold' }}>Today's idea:</Text> Try a Medieval Pet Portrait!</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type NavTabProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

function NavTab({ icon, label, active }: NavTabProps) {
  return (
    <TouchableOpacity style={[styles.navTab, active && styles.navTabActive]}>
      {icon}
      <Text style={[styles.navTabLabel, active && styles.navTabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#18181b',
  },
  pawBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    zIndex: 0,
    backgroundColor: 'transparent',
    backgroundRepeat: 'repeat',
    // Optionally, use an SVG or image for paw prints
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 8,
    paddingHorizontal: 24,
    zIndex: 2,
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#d4d4d8',
    marginBottom: 0,
  },
  mascot: {
    width: 120,
    height: 120,
    marginLeft: 12,
  },
  galleryCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2,
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#27272a',
    marginBottom: 8,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  galleryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  galleryImg: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 4,
    borderWidth: 3,
    borderColor: '#c4b5fd',
  },
  galleryLabel: {
    fontSize: 13,
    color: '#52525b',
    textAlign: 'center',
  },
  actionsSection: {
    marginTop: 36,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  actionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#a78bfa',
    marginBottom: 16,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: '#a78bfa',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    padding: 18,
    marginBottom: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  actionCardImg: {
    width: 112,
    height: 112,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
  },
  actionCardButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionCardButtonText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dailyIdea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31,41,55,0.85)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    maxWidth: 400,
  },
  dailyIdeaText: {
    color: 'white',
    fontSize: 15,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    zIndex: 10,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  navTabActive: {},
  navTabLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  navTabLabelActive: {
    color: '#a78bfa',
    fontWeight: 'bold',
  },
}); 