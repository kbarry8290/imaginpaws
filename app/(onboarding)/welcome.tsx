import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Wand as Wand2 } from 'lucide-react-native';
import { useAnonymousTransformations } from '@/contexts/AnonymousTransformationsContext';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { canTransform, transformationsLeft } = useAnonymousTransformations();

  const handleGetStarted = () => {
    if (canTransform) {
      router.push('/permissions');
    } else {
      // If no transformations left, redirect to signup
      router.push('/signup');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.authLink}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.authLinkText, { color: colors.primary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            🐾 Ever wondered what your pet would look like as a person?
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Transform your pet in one tap!
          </Text>
        </View>

        <Button
          title={canTransform ? "Get Started" : "Create Account"}
          onPress={handleGetStarted}
          icon={<Wand2 size={24} color="white" />}
          style={styles.button}
        />

        <TouchableOpacity 
          style={styles.signupContainer}
          onPress={() => router.push('/signup')}
        >
          <Text style={[styles.signupText, { color: colors.placeholderText }]}>
            Don't have an account?{' '}
            <Text style={{ color: colors.primary }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Layout.spacing.m,
  },
  authLink: {
    padding: Layout.spacing.s,
  },
  authLinkText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  content: {
    flex: 1,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.extraLarge,
    overflow: 'hidden',
    marginBottom: Layout.spacing.xl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  button: {
    minWidth: 200,
  },
  signupContainer: {
    marginTop: Layout.spacing.l,
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
});