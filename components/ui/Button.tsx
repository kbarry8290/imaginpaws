import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import React from 'react';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';

type ButtonProps = {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyle = () => {
    const baseStyles: ViewStyle[] = [styles.button];
    
    if (size === 'small') baseStyles.push(styles.buttonSmall);
    if (size === 'large') baseStyles.push(styles.buttonLarge);
    if (fullWidth) baseStyles.push(styles.buttonFullWidth);
    
    if (variant === 'primary') {
      baseStyles.push({ backgroundColor: colors.primary });
    } else if (variant === 'secondary') {
      baseStyles.push({ backgroundColor: colors.secondary });
    } else if (variant === 'outline') {
      baseStyles.push({ 
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary
      });
    }
    
    if (disabled) {
      baseStyles.push({ opacity: 0.6 });
    }
    
    return baseStyles;
  };

  const getTextStyle = () => {
    const baseStyles: TextStyle[] = [styles.buttonText];
    
    if (size === 'small') baseStyles.push(styles.buttonTextSmall);
    if (size === 'large') baseStyles.push(styles.buttonTextLarge);
    
    if (variant === 'outline') {
      baseStyles.push({ color: colors.primary });
    }
    
    return baseStyles;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator 
            color={variant === 'outline' ? colors.primary : 'white'} 
            size="small" 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonSmall: {
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
  },
  buttonLarge: {
    paddingVertical: Layout.spacing.l,
    paddingHorizontal: Layout.spacing.xl,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: 14,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  iconContainer: {
    marginRight: Layout.spacing.s,
  },
});