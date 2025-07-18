import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PortraitType } from '@/constants/portraitOptions';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import OptionSelector from './ui/OptionSelector';

interface PortraitTypeSelectorProps {
  selectedType: PortraitType;
  onSelect: (type: PortraitType) => void;
  isExpanded: boolean;
  onExpand: () => void;
}

const portraitTypeOptions = [
  { label: 'Royalty', value: 'royalty', emoji: '👑' },
  { label: 'Superhero', value: 'superhero', emoji: '🦸' },
  { label: 'Cartoon', value: 'cartoon', emoji: '🎨' },
  { label: 'Vintage', value: 'vintage', emoji: '📷' },
  { label: 'Fantasy', value: 'fantasy', emoji: '🧙' },
  { label: 'Rockstar', value: 'rockstar', emoji: '🎸' },
  { label: 'Sports', value: 'sports', emoji: '⚽' },
  { label: 'Festival', value: 'festival', emoji: '🎪' },
  { label: 'Futuristic', value: 'futuristic', emoji: '🚀' },
  { label: 'Abstract', value: 'abstract', emoji: '🎭' }
];

export default function PortraitTypeSelector({ 
  selectedType, 
  onSelect,
  isExpanded,
  onExpand
}: PortraitTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <OptionSelector
        name="portrait_type"
        label="Portrait Type"
        options={portraitTypeOptions}
        selectedValue={selectedType}
        onSelect={(value) => onSelect(value as PortraitType)}
        compact
        isExpanded={isExpanded}
        onExpand={onExpand}
        zIndex={7}
        style={styles.optionSelector}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.l,
  },
  optionSelector: {
    height: 48,
    borderRadius: Layout.borderRadius.medium,
  },
}); 