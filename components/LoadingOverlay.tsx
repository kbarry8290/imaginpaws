import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform,
  Animated
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { PawPrint as Paw } from 'lucide-react-native';

const loadingMessages = [
  "Analyzing whiskers... 🐱",
  "Fluffing the hairstyle... 💇‍♂️",
  "Imagining paws as hands... 🐾",
  "Giving your pet a glow-up... ✨",
  "Drawing stylish socks... 🧦",
  "Picking the perfect outfit... 👔",
  "Converting meows to words... 💭",
  "Adding human charm... ✨",
  "Transforming tail to legs... 🦿",
  "Adjusting the cuteness level... 🥰"
];

export default function LoadingOverlay() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [message, setMessage] = useState(loadingMessages[0]);
  
  // Create three animated values for the paw prints
  const paw1 = React.useRef(new Animated.Value(0)).current;
  const paw2 = React.useRef(new Animated.Value(0)).current;
  const paw3 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cycle through messages every 2 seconds
    const interval = setInterval(() => {
      setMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2000);

    // Create animation sequence for paws
    const createPawAnimation = (value: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    };

    // Create looping animation
    const loopAnimation = () => {
      Animated.parallel([
        createPawAnimation(paw1, 0),
        createPawAnimation(paw2, 200),
        createPawAnimation(paw3, 400),
      ]).start(() => loopAnimation());
    };

    loopAnimation();

    return () => clearInterval(interval);
  }, [paw1, paw2, paw3]);

  const getAnimatedStyle = (value: Animated.Value) => ({
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.3],
    }),
  });

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background + 'F0' }]}>
      <View style={styles.content}>
        <View style={styles.pawContainer}>
          <Animated.View style={getAnimatedStyle(paw1)}>
            <Paw size={40} color={colors.primary} />
          </Animated.View>
          <Animated.View style={getAnimatedStyle(paw2)}>
            <Paw size={40} color={colors.primary} />
          </Animated.View>
          <Animated.View style={getAnimatedStyle(paw3)}>
            <Paw size={40} color={colors.primary} />
          </Animated.View>
        </View>
        
        <Text 
          style={[
            styles.loadingText,
            { color: colors.text }
          ]}
        >
          {message}
        </Text>
        
        <Text style={[styles.subText, { color: colors.placeholderText }]}>
          Our AI is working its magic! 🪄
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  content: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  pawContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.l,
  },
  loadingText: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  subText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
});