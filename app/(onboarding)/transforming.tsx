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
import { logTransformEvent, logError, logApiCall } from '@/utils/logging';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'https://imaginpaws.com/api/generate-human';
const API_KEY = process.env.EXPO_PUBLIC_IMAGINPAWS_API_KEY;
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
    if (!API_URL || !API_KEY) {
      throw new Error('API configuration is missing. Please contact support.');
    }
  };

  const getErrorMessage = (response: Response, errorText: string) => {
    // Handle 500 errors with user-friendly message
    if (response.status === 500) {
      return "I'm sorry, something went wrong. Please try again.";
    }
    
    // For other API errors, show the generic API error message
    return `API error: ${response.status}`;
  };

  const performTransformation = async () => {
    try {
      setError(null);
      
      // Validate inputs
      validateInputs();
      
      // Check network connection
      await checkNetworkConnection();

      const settings: TransformSettings = JSON.parse(params.settings);
      
      logTransformEvent('started', { settings });

      const formData = new FormData();

      let imageFile;
      if (Platform.OS === 'web') {
        const response = await fetch(params.photo);
        const blob = await response.blob();
        imageFile = new File([blob], 'pet.jpg', { type: 'image/jpeg' });
      } else {
        imageFile = {
          uri: params.photo,
          type: 'image/jpeg',
          name: 'pet.jpg',
        };
      }
      formData.append('image', imageFile as any);
      formData.append('user_id', 'anonymous');

      Object.entries(settings).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TRANSFORM_TIMEOUT);

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          logApiCall('POST', API_URL, response.status, errorText);
          
          // Use the new error message function
          const userFriendlyError = getErrorMessage(response, errorText);
          throw new Error(userFriendlyError);
        }

        const data = await response.json();
        logApiCall('POST', API_URL, response.status, null, { success: true });

        // Record the transformation for anonymous users
        await recordTransformation({
          originalPhoto: data.original_photo,
          resultPhoto: data.result_photo,
          settings,
        });

        logTransformEvent('completed', { settings });

        router.push({
          pathname: '/result',
          params: {
            originalPhoto: data.original_photo,
            resultPhoto: data.result_photo,
            settings: JSON.stringify(settings)
          }
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Transformation timed out. Please try again.');
        }
        throw err;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to transform image. Please try again.';
      setError(errorMessage);
      
      logTransformEvent('failed', { 
        error: errorMessage,
        settings: params.settings ? JSON.parse(params.settings) : null
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