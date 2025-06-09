import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import PhotoUploader from '@/components/PhotoUploader';
import TransformOptions, { TransformSettings } from '@/components/TransformOptions';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Wand as Wand2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { logTransformEvent, logError, logApiCall } from '@/utils/logging';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'https://imaginpaws.com/api/generate-human';
const API_KEY = process.env.EXPO_PUBLIC_IMAGINPAWS_API_KEY;
const TRANSFORM_TIMEOUT = 120000; // 120 seconds

export default function TransformScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { canScan, consumeCredit } = useCredits();
  
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformSettings, setTransformSettings] = useState<TransformSettings>({
    sex: 'male',
    style: 'realistic',
    personality: 'playful',
    clothing: 'casual',
    background: 'plain',
    age: 'adult',
  });

  const handleSettingsChange = (key: keyof TransformSettings, value: string) => {
    setTransformSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const checkNetworkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
  };

  const validateInputs = () => {
    if (!petPhoto) {
      throw new Error('Please upload a pet photo first!');
    }
    if (!API_URL || !API_KEY) {
      throw new Error('API configuration is missing. Please contact support.');
    }
    if (!user) {
      throw new Error('Please sign in to transform your pet.');
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

  const handleTransform = async () => {
    try {
      setError(null);
      
      // Validate inputs
      validateInputs();
      
      // Check network connection
      await checkNetworkConnection();

      if (!canScan) {
        router.push('/pro');
        return;
      }

      setIsTransforming(true);
      logTransformEvent('started', { settings: transformSettings });

      const formData = new FormData();

      let imageFile;
      if (Platform.OS === 'web') {
        const response = await fetch(petPhoto!);
        const blob = await response.blob();
        imageFile = new File([blob], 'pet.jpg', { type: 'image/jpeg' });
      } else {
        imageFile = {
          uri: petPhoto,
          type: 'image/jpeg',
          name: 'pet.jpg',
        };
      }
      formData.append('image', imageFile as any);
      formData.append('user_id', user!.id);

      Object.entries(transformSettings).forEach(([key, value]) => {
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

        // Only consume credit after successful transformation
        const success = await consumeCredit();
        if (!success) {
          throw new Error('Failed to consume credit');
        }
        
        if (user) {
          try {
            const { error: saveError } = await supabase
              .from('transformations')
              .insert({
                user_id: user.id,
                original_photo: data.original_photo,
                result_photo: data.result_photo,
                ...transformSettings,
              });

            if (saveError) {
              console.error('Error saving transformation:', saveError);
              logError(saveError, { context: 'saving_transformation' });
            }
          } catch (err) {
            console.error('Error saving transformation:', err);
            logError(err as Error, { context: 'saving_transformation' });
          }
        }

        logTransformEvent('completed', { 
          settings: transformSettings,
          userId: user?.id 
        });

        router.push({
          pathname: '/results',
          params: {
            originalPhoto: data.original_photo,
            resultPhoto: data.result_photo,
            settings: JSON.stringify(transformSettings)
          }
        });
      } catch (err) {
        if ((err as any).name === 'AbortError') {
          throw new Error('Transformation timed out. Please try again.');
        }
        throw err;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to transform image. Please try again.');
      logTransformEvent('failed', { 
        error: err.message,
        settings: transformSettings,
        userId: user?.id
      });
      logError(err, { 
        context: 'transform',
        settings: transformSettings,
        userId: user?.id
      });
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              ImaginPaws
            </Text>
          </View>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          <PhotoUploader 
            photo={petPhoto}
            onPhotoSelect={setPetPhoto}
          />
          
          <TransformOptions 
            settings={transformSettings}
            onSettingsChange={handleSettingsChange}
          />
        </ScrollView>
      </View>

      <View 
        style={[
          styles.buttonContainer, 
          { 
            backgroundColor: colors.background,
            borderTopColor: colors.border 
          }
        ]}
      >
        <Button
          title={canScan ? "Transform Pet 🪄" : "Get More Credits"}
          onPress={handleTransform}
          size="small"
          fullWidth
          icon={<Wand2 size={20} color="white" />}
          isLoading={isTransforming}
          disabled={!petPhoto || isTransforming}
          style={styles.transformButton}
        />
      </View>

      {isTransforming && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.l,
  },
  header: {
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center',
  },
  errorContainer: {
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.m,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: Layout.spacing.s,
    borderTopWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transformButton: {
    height: 44,
  },
});