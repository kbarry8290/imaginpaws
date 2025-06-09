import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { UserPlus, X as Close } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { useAnonymousTransformations } from '@/contexts/AnonymousTransformationsContext';
import ResultCard from '@/components/ResultCard';
import { TransformSettings } from '@/components/TransformOptions';

export default function ResultScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{
    originalPhoto: string;
    resultPhoto: string;
    settings: string;
  }>();
  const { transformationsLeft } = useAnonymousTransformations();

  const settings: TransformSettings = params.settings ? JSON.parse(params.settings) : null;

  const handleSignUp = () => {
    router.push('/signup');
  };
  const handleSignIn = () => {
    router.push('/login');
  };
  const handleClose = () => {
    router.replace('/');
  };

  if (!params.originalPhoto || !params.resultPhoto || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No transformation results found
          </Text>
          <Button
            title="Start Over"
            onPress={() => router.push('/welcome')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Close size={28} color={colors.placeholderText} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Here's Your Pet's Human Look! ✨
        </Text>

        <ResultCard
          originalPhoto={params.originalPhoto}
          resultPhoto={params.resultPhoto}
          settings={settings}
          isLoading={false}
        />

        <Card style={styles.signupPrompt}>
          <Text style={[styles.signupTitle, { color: colors.text }]}>
            Want to see more transformations?
          </Text>
          <Text style={[styles.signupText, { color: colors.placeholderText }]}>
            Create a free account and get 2 more free transformations!
          </Text>
          <Button
            title="Create Account"
            onPress={handleSignUp}
            icon={<UserPlus size={24} color="white" />}
            style={styles.signupButton}
          />
          <TouchableOpacity onPress={handleSignIn} style={styles.signInLinkContainer}>
            <Text style={[styles.signInLink, { color: colors.primary }]}>Already have an account? Sign in</Text>
          </TouchableOpacity>
          <Text style={[styles.signupSubtext, { color: colors.placeholderText }]}>
            Unlock your own gallery, save favorites, and transform again. It's free!
          </Text>
        </Card>
      </View>
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
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  signupPrompt: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  signupTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  signupText: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
  signupSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginTop: Layout.spacing.m,
    opacity: 0.8,
  },
  signupButton: {
    minWidth: 240,
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
  button: {
    minWidth: 200,
  },
  closeButton: {
    position: 'absolute',
    top: Layout.spacing.xs,
    right: Layout.spacing.l,
    zIndex: 10,
    padding: Layout.spacing.s,
  },
  signInLinkContainer: {
    marginTop: Layout.spacing.s,
    alignItems: 'center',
  },
  signInLink: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});