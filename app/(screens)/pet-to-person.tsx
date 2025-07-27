import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import PhotoUploader from '@/components/PhotoUploader';
import TransformOptions, { TransformSettings } from '@/components/TransformOptions';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Wand2, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { logTransformEvent, logError, logApiCall } from '@/utils/logging';
import { trackTransformEvent, startTransformationTiming, trackTransformationTiming } from '@/utils/mixpanel';
import NetInfo from '@react-native-community/netinfo';
import { generateImage } from '@/utils/api';

const TRANSFORM_TIMEOUT = 120000; // 120 seconds

export default function PetToPersonScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { canScan, consumeCredit } = useCredits();
  
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformSettings, setTransformSettings] = useState<TransformSettings>({
    gender: 'male',
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
    if (!user) {
      throw new Error('Please sign in to transform your pet.');
    }
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
      trackTransformEvent('started', 'pet-to-person', transformSettings);
      startTransformationTiming('pet-to-person');

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TRANSFORM_TIMEOUT);

      try {
        if (!user || !petPhoto) {
          throw new Error('Missing required data');
        }

        const result = await generateImage({
          transformation_type: 'pet-to-person',
          user_id: user.id,
          image: petPhoto,
          gender: transformSettings.gender,
          style: transformSettings.style,
          clothing: transformSettings.clothing,
        });

        clearTimeout(timeoutId);

        // Only consume credit after successful transformation
        const success = await consumeCredit();
        if (!success) {
          throw new Error('Failed to consume credit');
        }
        
        // Extract result photo URL from the response object
        const resultPhoto = result?.result_photo;
        console.log('Result photo URL to save:', resultPhoto);
        if (!resultPhoto) {
          setError('No result photo returned from the server. Transformation will not be saved.');
          return;
        }
        if (user) {
          try {
            // Prepare payload with only defined, required fields
            const payload: Record<string, any> = {
              user_id: user.id,
              original_photo: petPhoto,
              result_photo: resultPhoto,
              transformation_type: 'pet-to-person',
              style: transformSettings.style,
              sex: transformSettings.gender,
              age: transformSettings.age,
              outfit: transformSettings.clothing,
              personality: transformSettings.personality,
              background: transformSettings.background,
            };
            // Remove any undefined/null fields (for non-nullable columns)
            Object.keys(payload).forEach(key => {
              if (payload[key] === undefined || payload[key] === null) {
                delete payload[key];
              }
            });
            const { data, error } = await supabase
              .from('transformations')
              .insert(payload);
            console.log('Insert result:', { data, error });

            if (error) {
              console.error('Error saving transformation:', error);
              logError(error, { context: 'saving_transformation' });
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
        trackTransformEvent('completed', 'pet-to-person', { ...transformSettings, userId: user?.id });
        trackTransformationTiming('pet-to-person', true, transformSettings);

        router.push({
          pathname: '/results',
          params: {
            originalPhoto: petPhoto,
            resultPhoto: resultPhoto,
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
      trackTransformEvent('failed', 'pet-to-person', { error: err.message, ...transformSettings, userId: user?.id });
      trackTransformationTiming('pet-to-person', false, transformSettings, err.message);
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/transform' as any)} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pet to Person</Text>
      </View>
      <View style={styles.contentContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
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
            borderTopColor: colors.border,
          }
        ]}
      >
        <Button
          title="Transform"
          onPress={handleTransform}
          disabled={!petPhoto || isTransforming}
          isLoading={isTransforming}
          icon={<Wand2 size={24} color="white" />}
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
    marginBottom: Layout.spacing.l,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
  },
  errorContainer: {
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.m,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  buttonContainer: {
    padding: Layout.spacing.l,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  backButton: {
    marginRight: Layout.spacing.m,
  },
}); 