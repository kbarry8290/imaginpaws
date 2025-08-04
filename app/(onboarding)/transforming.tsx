import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAnonymousTransformations } from '@/contexts/AnonymousTransformationsContext';
import Card from '@/components/ui/Card';
import { TransformSettings } from '@/components/TransformOptions';
import { logError } from '@/utils/logging';
import { trackTransformEvent } from '@/utils/mixpanel';
import NetInfo from '@react-native-community/netinfo';
import { generateImage } from '@/utils/api';

const TRANSFORM_TIMEOUT = 120000; // 120 seconds

export default function TransformingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{
    photo: string;
    settings: string;
  }>();
  const { transformationsLeft, recordTransformation } = useAnonymousTransformations();
  const [error, setError] = useState<string | null>(null);

  const checkNetworkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
  };

  const validateInputs = () => {
    if (!params.photo) {
      throw new Error('No photo provided');
    }
    if (!params.settings) {
      throw new Error('No settings provided');
    }
  };

  const performTransformation = async () => {
    try {
      setError(null);
      
      // Validate inputs
      validateInputs();
      
      // Check network connection
      await checkNetworkConnection();

      const settings: TransformSettings = JSON.parse(params.settings);
      
      trackTransformEvent('started', 'pet-to-person', settings);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TRANSFORM_TIMEOUT);

      try {
        const result = await generateImage({
          transformation_type: 'pet-to-person',
          user_id: 'anonymous',
          image: params.photo,
          gender: settings.gender,
          style: settings.style,
          clothing: settings.clothing,
          background: settings.background,
        });

        clearTimeout(timeoutId);

        // Record the transformation for anonymous users
        await recordTransformation({
          originalPhoto: result.original_photo,
          resultPhoto: result.result_photo,
          settings,
        });

        trackTransformEvent('completed', 'pet-to-person', settings);

        router.push({
          pathname: '/result',
          params: {
            originalPhoto: result.original_photo,
            resultPhoto: result.result_photo,
            settings: JSON.stringify(settings)
          }
        });
      } catch (err) {
        if ((err as any).name === 'AbortError') {
          throw new Error('Transformation timed out. Please try again.');
        }
        throw err;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to transform image. Please try again.';
      setError(errorMessage);
      
      trackTransformEvent('failed', 'pet-to-person', { 
        error: errorMessage,
        ...(params.settings ? JSON.parse(params.settings) : {})
      });
      logError(err, { 
        context: 'onboarding_transform',
        photo: params.photo,
        settings: params.settings
      });

      // Show error and allow retry or go back
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Transformation Failed',
          errorMessage,
          [
            { text: 'Try Again', onPress: performTransformation },
            { text: 'Go Back', onPress: () => router.back() }
          ]
        );
      }
    }
  };

  // Start transformation when component mounts
  useEffect(() => {
    performTransformation();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Creating Your Pet's Human Version...
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
          Our AI is working its magic. Hang tight!
        </Text>

        {transformationsLeft > 0 && (
          <Card style={styles.remainingCard}>
            <Text style={[styles.remainingText, { color: colors.placeholderText }]}>
              You have {transformationsLeft} free {transformationsLeft === 1 ? 'transformation' : 'transformations'} left
            </Text>
          </Card>
        )}

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            {Platform.OS === 'web' && (
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={performTransformation}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: colors.secondary }]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
      </View>
      {!error && <LoadingOverlay />}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  remainingCard: {
    marginTop: Layout.spacing.xl,
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
  },
  remainingText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  errorCard: {
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.l,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  retryButton: {
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.small,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
  },
  backButton: {
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.small,
  },
  backButtonText: {
    color: 'white',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
  },
});