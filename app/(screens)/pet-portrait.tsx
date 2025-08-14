import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import { portraitOptions, PortraitType, PortraitAttributeSet } from '@/constants/portraitOptions';
import { generateImage } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Sparkles, ArrowLeft } from 'lucide-react-native';
import { logError, logApiCall } from '@/utils/logging';
import { trackTransformEvent, startTransformationTiming, trackTransformationTiming } from '@/utils/mixpanel';
import NetInfo from '@react-native-community/netinfo';
import PhotoUploader from '@/components/PhotoUploader';
import PortraitOptions, { PortraitSettings } from '@/components/PortraitOptions';
import PortraitTypeSelector from '@/components/PortraitTypeSelector';
import { supabase } from '@/lib/supabase';

type Gender = 'male' | 'female';

interface PortraitAttributes {
  portrait_type: PortraitType;
  gender: Gender;
  outfit: string;
  accessories: string;
  background: string;
  art_style: string;
  mood: string;
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAttributes(type: PortraitType): Omit<PortraitSettings, 'portrait_type' | 'gender'> {
  const options = portraitOptions[type];
  return {
    outfit: getRandomItem(options.outfits),
    accessories: getRandomItem(options.accessories),
    background: getRandomItem(options.backgrounds),
    art_style: getRandomItem(options.art_styles),
    mood: getRandomItem(options.moods),
  };
}

export default function PetPortraitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { canScan, spendOne, isSpending, error: creditsError, clearError } = useCredits();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<PortraitSettings>({
    portrait_type: 'royalty',
    gender: 'male',
    outfit: '',
    accessories: '',
    background: '',
    art_style: '',
    mood: '',
  });

  useEffect(() => {
    // Set random defaults when portrait type changes
    const randomAttrs = getRandomAttributes(settings.portrait_type);
    setSettings(prev => ({
      ...prev,
      ...randomAttrs,
    }));
  }, [settings.portrait_type]);



  const checkNetworkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
  };

  const validateInputs = () => {
    if (!image) {
      throw new Error('Please upload a pet photo first!');
    }
    if (!user) {
      throw new Error('Please sign in to transform your pet.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSettingsChange = (key: keyof PortraitSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGenerate = async () => {
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

      setIsGenerating(true);
      trackTransformEvent('started', 'portrait', settings);
      startTransformationTiming('portrait');

      if (!image) {
        throw new Error('No image selected');
      }

      // Call generateImage and get both URLs from the backend
      const { result_photo, original_photo } = await generateImage({
        transformation_type: 'portrait',
        user_id: user!.id,
        image,
        gender: settings.gender,
        portrait_type: settings.portrait_type,
        outfit: settings.outfit,
        accessories: settings.accessories,
        background: settings.background,
        art_style: settings.art_style,
        mood: settings.mood,
      });

      // Only spend credit after successful transformation
      const success = await spendOne();
      if (!success) {
        throw new Error('Failed to consume credit');
      }

      // Log and check result_photo before saving
      console.log('Result photo URL to save:', result_photo);
      if (!result_photo || !original_photo) {
        setError('No result or original photo returned from the server. Transformation will not be saved.');
        return;
      }

      if (user) {
        try {
          // Prepare payload with only defined, required fields
          const payload: Record<string, any> = {
            user_id: user.id,
            original_photo: original_photo, // Use S3 URL from backend
            result_photo: result_photo,
            transformation_type: 'portrait',
            portrait_type: settings.portrait_type,
            sex: settings.gender,
            outfit: settings.outfit,
            accessories: settings.accessories,
            background: settings.background,
            mood: settings.mood,
            art_style: settings.art_style,
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
          console.log('Insert result:', {
            data,
            errorMessage: error?.message,
            errorDetails: error?.details,
            errorHint: error?.hint
          });
        } catch (err) {
          console.error('Error saving transformation:', err);
          logError(err as Error, { context: 'saving_transformation' });
        }
      }

            trackTransformEvent('completed', 'portrait', { ...settings, userId: user?.id });
      trackTransformationTiming('portrait', true, settings);

      // Navigate to results screen with the generated image
      router.push({
        pathname: '/results',
        params: {
          originalPhoto: original_photo, // Use S3 URL for results screen too
          resultPhoto: result_photo,
          settings: JSON.stringify(settings),
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate portrait. Please try again.');
      trackTransformEvent('failed', 'portrait', { error: err.message, ...settings, userId: user?.id });
      trackTransformationTiming('portrait', false, settings, err.message);
      logError(err, { 
        context: 'transform',
        settings,
        userId: user?.id
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/transform' as any)} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pet Portrait</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        
        {creditsError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{creditsError}</Text>
            <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
              <Text style={[styles.dismissText, { color: colors.error }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.photoSection}>
          <PhotoUploader 
            photo={image}
            onPhotoSelect={setImage}
            buttonText="Choose Pet Photo"
          />
        </View>

        <View style={styles.typeSelectorSection}>
          <PortraitTypeSelector
            selectedType={settings.portrait_type}
            onSelect={(type) => handleSettingsChange('portrait_type', type)}
          />
        </View>
        
        <View style={styles.optionsSection}>
          <PortraitOptions 
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
          title="Generate Portrait"
          onPress={handleGenerate}
          disabled={!image || isGenerating || isSpending}
          isLoading={isGenerating || isSpending}
          icon={<Sparkles size={24} color="white" />}
        />
      </View>

      {isGenerating && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.l,
    paddingBottom: Layout.spacing.xxl + 80, // Add extra bottom padding for the button
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  backButton: {
    marginRight: Layout.spacing.m,
  },
  title: {
    fontSize: 20,
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
  photoSection: {
    marginBottom: Layout.spacing.xl,
  },
  typeSelectorSection: {
    marginBottom: Layout.spacing.l,
  },
  optionsSection: {
    marginBottom: Layout.spacing.xl,
    zIndex: 1,
    elevation: 1,
  },
  buttonContainer: {
    padding: Layout.spacing.l,
    borderTopWidth: 1,
  },
  dismissButton: {
    marginTop: Layout.spacing.s,
    alignSelf: 'flex-end',
  },
  dismissText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textDecorationLine: 'underline',
  },
}); 