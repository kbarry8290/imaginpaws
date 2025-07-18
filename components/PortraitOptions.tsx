import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { portraitOptions, PortraitType, PortraitAttributeSet } from '@/constants/portraitOptions';
import OptionSelector from './ui/OptionSelector';
import Card from './ui/Card';

export interface PortraitSettings {
  portrait_type: PortraitType;
  gender: 'male' | 'female';
  outfit: string;
  accessories: string;
  background: string;
  art_style: string;
  mood: string;
}

interface PortraitOptionsProps {
  settings: PortraitSettings;
  onSettingsChange: (key: keyof PortraitSettings, value: string) => void;
}

type PortraitAttributeKey = keyof Omit<PortraitAttributeSet, 'portrait_type'>;

export default function PortraitOptions({ settings, onSettingsChange }: PortraitOptionsProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const handleExpand = (optionName: string) => {
    setExpandedOption(expandedOption === optionName ? null : optionName);
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const getOptionsForType = (type: PortraitType, key: PortraitAttributeKey) => {
    return portraitOptions[type][key].map(option => ({
      label: option,
      value: option,
    }));
  };

  return (
    <Card style={styles.container}>
      <View style={styles.optionsGrid}>
        <View style={styles.column}>
          <OptionSelector
            name="gender"
            label="Gender"
            options={genderOptions}
            selectedValue={settings.gender}
            onSelect={(value) => onSettingsChange('gender', value as 'male' | 'female')}
            compact
            isExpanded={expandedOption === 'gender'}
            onExpand={handleExpand}
            zIndex={6}
          />
          <OptionSelector
            name="outfit"
            label="Outfit"
            options={getOptionsForType(settings.portrait_type, 'outfits')}
            selectedValue={settings.outfit}
            onSelect={(value) => onSettingsChange('outfit', value)}
            compact
            isExpanded={expandedOption === 'outfit'}
            onExpand={handleExpand}
            zIndex={5}
          />
          <OptionSelector
            name="accessories"
            label="Accessories"
            options={getOptionsForType(settings.portrait_type, 'accessories')}
            selectedValue={settings.accessories}
            onSelect={(value) => onSettingsChange('accessories', value)}
            compact
            isExpanded={expandedOption === 'accessories'}
            onExpand={handleExpand}
            zIndex={4}
          />
        </View>
        <View style={styles.column}>
          <OptionSelector
            name="background"
            label="Background"
            options={getOptionsForType(settings.portrait_type, 'backgrounds')}
            selectedValue={settings.background}
            onSelect={(value) => onSettingsChange('background', value)}
            compact
            isExpanded={expandedOption === 'background'}
            onExpand={handleExpand}
            zIndex={3}
          />
          <OptionSelector
            name="art_style"
            label="Art Style"
            options={getOptionsForType(settings.portrait_type, 'art_styles')}
            selectedValue={settings.art_style}
            onSelect={(value) => onSettingsChange('art_style', value)}
            compact
            isExpanded={expandedOption === 'art_style'}
            onExpand={handleExpand}
            zIndex={2}
          />
          <OptionSelector
            name="mood"
            label="Mood"
            options={getOptionsForType(settings.portrait_type, 'moods')}
            selectedValue={settings.mood}
            onSelect={(value) => onSettingsChange('mood', value)}
            compact
            isExpanded={expandedOption === 'mood'}
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