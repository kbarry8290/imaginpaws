import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StyleProp,
  ViewStyle,
  Platform
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { ChevronDown } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';

type Option = {
  label: string;
  value: string;
  emoji?: string;
};

type OptionSelectorProps = {
  name: string;
  label: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  isExpanded: boolean;
  onExpand: (name: string) => void;
  zIndex?: number;
};

export default function OptionSelector({
  name,
  label,
  options,
  selectedValue,
  onSelect,
  style,
  compact = false,
  isExpanded,
  onExpand,
  zIndex = 1,
}: OptionSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const rotateValue = useSharedValue(0);
  const heightValue = useSharedValue(0);
  
  React.useEffect(() => {
    rotateValue.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    heightValue.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isExpanded]);
  
  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotateValue.value * 180}deg` },
      ],
    };
  });
  
  const dropdownStyle = useAnimatedStyle(() => {
    return {
      maxHeight: heightValue.value * (compact ? 160 : 200),
      opacity: heightValue.value,
      overflow: 'hidden',
    };
  });

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <View style={[
      styles.container, 
      { zIndex },
      Platform.OS === 'web' && { position: 'relative' },
      style
    ]}>
      <Text style={[
        styles.label, 
        { color: colors.text },
        compact && styles.labelCompact
      ]}>
        {label}
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.selector, 
          { 
            borderColor: colors.border,
            backgroundColor: isExpanded ? colors.primary + '10' : 'transparent'
          },
          compact && styles.selectorCompact
        ]} 
        onPress={() => onExpand(name)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedContainer}>
          {selectedOption?.emoji && (
            <Text style={[
              styles.emoji,
              compact && styles.emojiCompact
            ]}>
              {selectedOption.emoji}
            </Text>
          )}
          <Text style={[
            styles.selectedText, 
            { color: colors.text },
            compact && styles.selectedTextCompact
          ]}>
            {selectedOption?.label || 'Select an option'}
          </Text>
        </View>
        <Animated.View style={rotateStyle}>
          <ChevronDown size={compact ? 16 : 20} color={colors.text} />
        </Animated.View>
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.optionsContainer, 
          dropdownStyle,
          { backgroundColor: colors.cardBackground }
        ]}
      >
        <ScrollView 
          style={styles.optionsList}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                selectedValue === option.value && {
                  backgroundColor: colors.primary + '20',
                },
                compact && styles.optionItemCompact
              ]}
              onPress={() => {
                onSelect(option.value);
                onExpand('');
              }}
            >
              <View style={styles.optionContent}>
                {option.emoji && (
                  <Text style={[
                    styles.emoji,
                    compact && styles.emojiCompact
                  ]}>
                    {option.emoji}
                  </Text>
                )}
                <Text 
                  style={[
                    styles.optionText, 
                    { color: colors.text },
                    selectedValue === option.value && styles.selectedOptionText,
                    compact && styles.optionTextCompact
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.xs,
  },
  labelCompact: {
    fontSize: 14,
    marginBottom: Layout.spacing.xs / 2,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    borderWidth: 1,
  },
  selectorCompact: {
    padding: Layout.spacing.s,
    minHeight: 40,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  selectedTextCompact: {
    fontSize: 14,
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    padding: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  optionItemCompact: {
    padding: Layout.spacing.s,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  optionTextCompact: {
    fontSize: 14,
  },
  selectedOptionText: {
    fontFamily: 'Nunito-Bold',
  },
  emoji: {
    fontSize: 18,
    marginRight: Layout.spacing.s,
  },
  emojiCompact: {
    fontSize: 16,
    marginRight: Layout.spacing.xs,
  },
});