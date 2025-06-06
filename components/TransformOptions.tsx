import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import OptionSelector from './ui/OptionSelector';
import Layout from '@/constants/Layout';
import Card from './ui/Card';

export type TransformSettings = {
  sex: string;
  style: string;
  personality: string;
  clothing: string;
  background: string;
  age: string;
};

type TransformOptionsProps = {
  settings: TransformSettings;
  onSettingsChange: (key: keyof TransformSettings, value: string) => void;
};

export default function TransformOptions({ 
  settings, 
  onSettingsChange 
}: TransformOptionsProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const handleExpand = (optionName: string) => {
    setExpandedOption(expandedOption === optionName ? null : optionName);
  };

  const sexOptions = [
    { label: 'Male', value: 'male', emoji: '👨' },
    { label: 'Female', value: 'female', emoji: '👩' },
  ];

  const styleOptions = [
    { label: 'Realistic', value: 'realistic', emoji: '📷' },
    { label: 'Anime', value: 'anime', emoji: '🎌' },
    { label: 'Cartoon', value: 'cartoon', emoji: '🎨' },
    { label: 'Pixel Art', value: 'pixel', emoji: '👾' },
    { label: 'Renaissance', value: 'renaissance', emoji: '🖼️' },
    { label: 'Cyberpunk', value: 'cyberpunk', emoji: '🤖' },
    { label: 'Fantasy', value: 'fantasy', emoji: '🧙' },
  ];

  const personalityOptions = [
    { label: 'Playful', value: 'playful', emoji: '😄' },
    { label: 'Grumpy', value: 'grumpy', emoji: '😠' },
    { label: 'Mysterious', value: 'mysterious', emoji: '🕵️' },
    { label: 'Goofy', value: 'goofy', emoji: '🤪' },
    { label: 'Cool', value: 'cool', emoji: '😎' },
    { label: 'Regal', value: 'regal', emoji: '👑' },
    { label: 'Lazy', value: 'lazy', emoji: '😴' },
    { label: 'Hyper', value: 'hyper', emoji: '⚡' },
  ];

  const clothingOptions = [
    { label: 'Casual', value: 'casual', emoji: '👕' },
    { label: 'Formal', value: 'formal', emoji: '👔' },
    { label: 'Futuristic', value: 'futuristic', emoji: '🚀' },
    { label: 'Medieval', value: 'medieval', emoji: '🏰' },
    { label: 'Hipster', value: 'hipster', emoji: '🧣' },
    { label: 'Punk', value: 'punk', emoji: '🤘' },
    { label: 'Superhero', value: 'superhero', emoji: '🦸' },
  ];

  const backgroundOptions = [
    { label: 'Plain', value: 'plain', emoji: '🎨' },
    { label: 'Bedroom', value: 'bedroom', emoji: '🛏️' },
    { label: 'Park', value: 'park', emoji: '🌳' },
    { label: 'Space', value: 'space', emoji: '🌌' },
    { label: 'City', value: 'city', emoji: '🏙️' },
    { label: 'Abstract', value: 'abstract', emoji: '🎭' },
  ];

  const ageOptions = [
    { label: 'Baby', value: 'baby', emoji: '👶' },
    { label: 'Teen', value: 'teen', emoji: '🧑' },
    { label: 'Adult', value: 'adult', emoji: '👨' },
    { label: 'Elder', value: 'elder', emoji: '👴' },
  ];

  return (
    <Card style={styles.container}>
      <View style={styles.optionsGrid}>
        <View style={styles.column}>
          <OptionSelector
            name="sex"
            label="Sex"
            options={sexOptions}
            selectedValue={settings.sex}
            onSelect={(value) => onSettingsChange('sex', value)}
            compact
            isExpanded={expandedOption === 'sex'}
            onExpand={handleExpand}
            zIndex={6}
          />
          
          <OptionSelector
            name="age"
            label="Age"
            options={ageOptions}
            selectedValue={settings.age}
            onSelect={(value) => onSettingsChange('age', value)}
            compact
            isExpanded={expandedOption === 'age'}
            onExpand={handleExpand}
            zIndex={5}
          />
          
          <OptionSelector
            name="personality"
            label="Personality"
            options={personalityOptions}
            selectedValue={settings.personality}
            onSelect={(value) => onSettingsChange('personality', value)}
            compact
            isExpanded={expandedOption === 'personality'}
            onExpand={handleExpand}
            zIndex={4}
          />
        </View>
        
        <View style={styles.column}>
          <OptionSelector
            name="style"
            label="Style"
            options={styleOptions}
            selectedValue={settings.style}
            onSelect={(value) => onSettingsChange('style', value)}
            compact
            isExpanded={expandedOption === 'style'}
            onExpand={handleExpand}
            zIndex={3}
          />
          
          <OptionSelector
            name="clothing"
            label="Clothing"
            options={clothingOptions}
            selectedValue={settings.clothing}
            onSelect={(value) => onSettingsChange('clothing', value)}
            compact
            isExpanded={expandedOption === 'clothing'}
            onExpand={handleExpand}
            zIndex={2}
          />
          
          <OptionSelector
            name="background"
            label="Background"
            options={backgroundOptions}
            selectedValue={settings.background}
            onSelect={(value) => onSettingsChange('background', value)}
            compact
            isExpanded={expandedOption === 'background'}
            onExpand={handleExpand}
            zIndex={1}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.l,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  column: {
    flex: 1,
    gap: Layout.spacing.m,
  },
});