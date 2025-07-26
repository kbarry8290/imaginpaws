import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PortraitType } from '@/constants/portraitOptions';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

interface PortraitTypeSelectorProps {
  selectedType: PortraitType;
  onSelect: (type: PortraitType) => void;
  isExpanded?: boolean;
  onExpand?: () => void;
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
  onSelect
}: PortraitTypeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Portrait Type</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={true}
      >
        {portraitTypeOptions.map((option) => {
          const isSelected = selectedType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.button,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
              onPress={() => onSelect(option.value as PortraitType)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[
                styles.buttonText,
                { color: isSelected ? 'white' : colors.text }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.l,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.m,
  },
  scrollContainer: {
    paddingHorizontal: Layout.spacing.l,
    paddingRight: Layout.spacing.xl,
    gap: Layout.spacing.m,
  },
  button: {
    minWidth: 100,
    height: 80,
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.m,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1 }],
  },
  emoji: {
    fontSize: 24,
    marginBottom: Layout.spacing.xs,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    lineHeight: 16,
  },
}); 