import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { History, Wand as Wand2 } from 'lucide-react-native';
import ResultCard from '@/components/ResultCard';
import { TransformSettings } from '@/components/TransformOptions';

export default function ResultsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{
    originalPhoto: string;
    resultPhoto: string;
    settings: string;
  }>();

  const settings: TransformSettings = params.settings ? JSON.parse(params.settings) : null;

  const handleNewTransform = () => {
    router.replace('/');
  };

  const handleViewHistory = () => {
    router.push('/gallery');
  };

  if (!params.originalPhoto || !params.resultPhoto || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No transformation results found
          </Text>
          <Button
            title="Start New Transformation"
            onPress={handleNewTransform}
            icon={<Wand2 size={24} color="white" />}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Transformation Complete!
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Your pet has been transformed into a human
          </Text>
        </View>

        <ResultCard
          originalPhoto={params.originalPhoto}
          resultPhoto={params.resultPhoto}
          settings={settings}
          isLoading={false}
        />

        {settings && (
          <View style={{ marginTop: Layout.spacing.l, marginBottom: Layout.spacing.l }}>
            <View style={{
              backgroundColor: colors.cardBackground,
              borderRadius: Layout.borderRadius.medium,
              padding: Layout.spacing.l,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: 'Nunito-Bold',
                marginBottom: Layout.spacing.s,
                color: colors.text,
              }}>
                Transformation Settings
              </Text>
              {(() => {
                // Option maps from TransformOptions.tsx
                const optionMaps = {
                  sex: [
                    { label: 'Male', value: 'male', emoji: '👨' },
                    { label: 'Female', value: 'female', emoji: '👩' },
                  ],
                  style: [
                    { label: 'Realistic', value: 'realistic', emoji: '📷' },
                    { label: 'Anime', value: 'anime', emoji: '🎌' },
                    { label: 'Cartoon', value: 'cartoon', emoji: '🎨' },
                    { label: 'Pixel Art', value: 'pixel', emoji: '👾' },
                    { label: 'Renaissance', value: 'renaissance', emoji: '🖼️' },
                    { label: 'Cyberpunk', value: 'cyberpunk', emoji: '🤖' },
                    { label: 'Fantasy', value: 'fantasy', emoji: '🧙' },
                  ],
                  personality: [
                    { label: 'Playful', value: 'playful', emoji: '😄' },
                    { label: 'Grumpy', value: 'grumpy', emoji: '😠' },
                    { label: 'Mysterious', value: 'mysterious', emoji: '🕵️' },
                    { label: 'Goofy', value: 'goofy', emoji: '🤪' },
                    { label: 'Cool', value: 'cool', emoji: '😎' },
                    { label: 'Regal', value: 'regal', emoji: '👑' },
                    { label: 'Lazy', value: 'lazy', emoji: '😴' },
                  ],
                  clothing: [
                    { label: 'Casual', value: 'casual', emoji: '👕' },
                    { label: 'Formal', value: 'formal', emoji: '👔' },
                    { label: 'Futuristic', value: 'futuristic', emoji: '🚀' },
                    { label: 'Medieval', value: 'medieval', emoji: '🏰' },
                    { label: 'Hipster', value: 'hipster', emoji: '🧣' },
                    { label: 'Punk', value: 'punk', emoji: '🤘' },
                    { label: 'Superhero', value: 'superhero', emoji: '🦸' },
                  ],
                  background: [
                    { label: 'Plain', value: 'plain', emoji: '🎨' },
                    { label: 'Bedroom', value: 'bedroom', emoji: '🛏️' },
                    { label: 'Park', value: 'park', emoji: '🌳' },
                    { label: 'Space', value: 'space', emoji: '🌌' },
                    { label: 'City', value: 'city', emoji: '🏙️' },
                    { label: 'Abstract', value: 'abstract', emoji: '🎭' },
                  ],
                  age: [
                    { label: 'Baby', value: 'baby', emoji: '👶' },
                    { label: 'Teen', value: 'teen', emoji: '🧑' },
                    { label: 'Adult', value: 'adult', emoji: '👨' },
                    { label: 'Elder', value: 'elder', emoji: '👴' },
                  ],
                };
                // Define the display order and friendly labels
                const displayOrder: Array<keyof typeof optionMaps> = [
                  'sex', 'style', 'age', 'clothing', 'personality', 'background'
                ];
                const friendlyLabels: Record<string, string> = {
                  sex: 'Sex',
                  style: 'Style',
                  age: 'Age',
                  clothing: 'Clothing',
                  personality: 'Personality',
                  background: 'Background',
                };
                return displayOrder.map((key) => {
                  const value = settings[key];
                  const options = optionMaps[key] as any[];
                  const found = options.find((opt: any) => opt.value === value);
                  return (
                    <View key={key} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: Layout.spacing.s / 2,
                    }}>
                      <Text style={{
                        fontSize: 16,
                        fontFamily: 'Nunito-Bold',
                        color: colors.text,
                      }}>
                        {friendlyLabels[key]}:
                      </Text>
                      <Text style={{ fontSize: 16, marginLeft: 8 }}>
                        {found?.emoji || ''}
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        fontFamily: 'Nunito-Regular',
                        color: colors.text,
                        marginLeft: 8,
                      }}>
                        {found ? found.label : value}
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <Button
            title="New Transformation"
            onPress={handleNewTransform}
            icon={<Wand2 size={24} color="white" />}
            style={styles.button}
          />
          <Button
            title="View History"
            onPress={handleViewHistory}
            variant="secondary"
            icon={<History size={24} color="white" />}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.l,
  },
  header: {
    marginBottom: Layout.spacing.l,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: Layout.spacing.m,
    marginTop: Layout.spacing.l,
  },
  button: {
    marginBottom: Layout.spacing.s,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
});