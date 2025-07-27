import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Wand as Wand2 } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { TransformSettings } from '@/components/TransformOptions';

type Step = {
  id: keyof TransformSettings;
  title: string;
  subtitle: string;
  options: Array<{
    value: string;
    label: string;
    emoji: string;
  }>;
};

const steps: Step[] = [
  {
    id: 'age',
    title: 'How old should your pet be as a human?',
    subtitle: 'Pick an age—they\'ll still act like themselves!',
    options: [
      { value: 'baby', label: 'Baby', emoji: '👶' },
      { value: 'teen', label: 'Teen', emoji: '🧑' },
      { value: 'adult', label: 'Adult', emoji: '👨' },
      { value: 'elder', label: 'Elder', emoji: '👴' },
    ],
  },
  {
    id: 'gender',
    title: 'Boy or Girl Vibes?',
    subtitle: 'Choose the vibe for your pet\'s human look.',
    options: [
      { value: 'male', label: 'Male', emoji: '👨' },
      { value: 'female', label: 'Female', emoji: '👩' },
    ],
  },
  {
    id: 'style',
    title: 'Pick a Style!',
    subtitle: 'How should their portrait look?',
    options: [
      { value: 'realistic', label: 'Realistic', emoji: '📷' },
      { value: 'anime', label: 'Anime', emoji: '🎌' },
      { value: 'cartoon', label: 'Cartoon', emoji: '🎨' },
      { value: 'pixel', label: 'Pixel Art', emoji: '👾' },
      { value: 'renaissance', label: 'Renaissance', emoji: '🖼️' },
      { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖' },
      { value: 'fantasy', label: 'Fantasy', emoji: '🧙' },
    ],
  },
  {
    id: 'personality',
    title: 'Personality?',
    subtitle: 'Choose the vibe that matches your pet.',
    options: [
      { value: 'playful', label: 'Playful', emoji: '😄' },
      { value: 'grumpy', label: 'Grumpy', emoji: '😠' },
      { value: 'mysterious', label: 'Mysterious', emoji: '🕵️' },
      { value: 'goofy', label: 'Goofy', emoji: '🤪' },
      { value: 'cool', label: 'Cool', emoji: '😎' },
      { value: 'regal', label: 'Regal', emoji: '👑' },
      { value: 'lazy', label: 'Lazy', emoji: '😴' },
    ],
  },
  {
    id: 'clothing',
    title: 'Dress Them Up!',
    subtitle: 'Pick a clothing style for your pet\'s human.',
    options: [
      { value: 'casual', label: 'Casual', emoji: '👕' },
      { value: 'formal', label: 'Formal', emoji: '👔' },
      { value: 'futuristic', label: 'Futuristic', emoji: '🚀' },
      { value: 'medieval', label: 'Medieval', emoji: '🏰' },
      { value: 'hipster', label: 'Hipster', emoji: '🧣' },
      { value: 'punk', label: 'Punk', emoji: '🤘' },
      { value: 'superhero', label: 'Superhero', emoji: '🦸' },
    ],
  },
  {
    id: 'background',
    title: 'Set the Scene!',
    subtitle: 'Where should your pet-human be?',
    options: [
      { value: 'plain', label: 'Plain', emoji: '🎨' },
      { value: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
      { value: 'park', label: 'Park', emoji: '🌳' },
      { value: 'space', label: 'Space', emoji: '🌌' },
      { value: 'city', label: 'City', emoji: '🏙️' },
      { value: 'abstract', label: 'Abstract', emoji: '🎭' },
    ],
  },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ photo: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<TransformSettings>({
    age: '',
    gender: '',
    style: '',
    personality: '',
    clothing: '',
    background: '',
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isComplete = Object.values(settings).every(value => value !== '');

  const handleSelect = (value: string) => {
    setSettings(prev => ({
      ...prev,
      [step.id]: value,
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      router.push({
        pathname: '/transforming',
        params: {
          photo: params.photo,
          settings: JSON.stringify(settings),
        },
      });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      router.back();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (isLastStep && isComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            Ready to See the Magic?
          </Text>

          <Card style={styles.summaryCard}>
            {Object.entries(settings).map(([key, value]) => {
              const stepConfig = steps.find(s => s.id === key);
              const option = stepConfig?.options.find(o => o.value === value);
              
              return (
                <View key={key} style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.placeholderText }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {option?.emoji} {option?.label}
                  </Text>
                </View>
              );
            })}
          </Card>

          <Button
            title="Transform!"
            onPress={handleNext}
            icon={<Wand2 size={24} color="white" />}
            style={styles.transformButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          {step.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
          {step.subtitle}
        </Text>

        <Card style={styles.optionsCard}>
          {step.options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                settings[step.id] === option.value && {
                  backgroundColor: colors.primary + '20',
                },
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Button
          title="Next"
          onPress={handleNext}
          icon={<ArrowRight size={24} color="white" />}
          disabled={!settings[step.id]}
          style={styles.nextButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.xl,
  },
  backButton: {
    marginBottom: Layout.spacing.l,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  optionsCard: {
    marginBottom: Layout.spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.s,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: Layout.spacing.m,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  nextButton: {
    marginTop: 'auto',
  },
  summaryCard: {
    marginBottom: Layout.spacing.xl,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  transformButton: {
    marginTop: 'auto',
  },
});