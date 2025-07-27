import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Platform,
  ActionSheetIOS,
  Alert
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import Card from './ui/Card';
import { logUserInteraction } from '@/utils/logging';

type PhotoUploaderProps = {
  photo: string | null;
  onPhotoSelect: (uri: string) => void;
  buttonText?: string;
};

export default function PhotoUploader({ photo, onPhotoSelect, buttonText = "Choose Photo" }: PhotoUploaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const processImage = async (uri: string) => {
    try {
      // For now, return the original URI without processing
      // The backend will handle image processing and S3 upload
      return uri;
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      return null;
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to take photos. Please enable it in your settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedUri = await processImage(result.assets[0].uri);
        if (processedUri) {
          logUserInteraction('take_photo', 'camera');
          onPhotoSelect(processedUri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission Required',
          'We need gallery access to select photos. Please enable it in your settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedUri = await processImage(result.assets[0].uri);
        if (processedUri) {
          logUserInteraction('choose_photo', 'gallery');
          onPhotoSelect(processedUri);
        }
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleImageSelection = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handleChoosePhoto();
          }
        }
      );
    } else if (Platform.OS === 'web') {
      // On web, directly open gallery since camera might not be available
      handleChoosePhoto();
    } else {
      // For Android, show a regular Alert dialog
      Alert.alert(
        'Select Photo',
        'Choose a method to add your photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handleChoosePhoto },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: photo }} 
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay}>
            <TouchableOpacity 
              style={[styles.changeButton, { backgroundColor: colors.primary }]}
              onPress={handleImageSelection}
            >
              <Text style={styles.changeButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Card style={styles.uploadContainer}>
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: colors.primary }]}
            onPress={handleImageSelection}
          >
            <Camera size={28} color="white" />
            <Text style={styles.uploadButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Layout.spacing.m,
  },
  uploadContainer: {
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.s,
    marginBottom: Layout.spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: 'white',
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: Layout.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.m,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  changeButton: {
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    alignSelf: 'center',
  },
  changeButtonText: {
    color: 'white',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
  },
});