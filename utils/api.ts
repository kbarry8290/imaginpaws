import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const API_URL = 'https://imaginpaws.com/api/generate-image';
const apiKey = Constants?.expoConfig?.extra?.EXPO_PUBLIC_IMAGINPAWS_API_KEY || '';

export type GenerateImageParams = {
  transformation_type: 'pet-to-person' | 'portrait';
  user_id: string;
  image: string;
  gender: string;
  // Pet to Person specific fields
  style?: string;
  clothing?: string;
  // Portrait specific fields
  portrait_type?: string;
  outfit?: string;
  accessories?: string;
  background?: string;
  art_style?: string;
  mood?: string;
  color_palette?: string;
};

export async function generateImage(params: GenerateImageParams): Promise<{ result_photo: string, original_photo: string }> {
  try {
    // Create form data
    const formData = new FormData();

    // Add all text fields
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'image') {
        formData.append(key, value);
      }
    });

    // Handle image file
    if (Platform.OS === 'web') {
      // For web, we need to fetch the image and convert it to a blob
      const response = await fetch(params.image);
      const blob = await response.blob();
      formData.append('image', blob, 'image.jpg');
    } else {
      // For native, we can use the file URI directly
      const filename = params.image.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: params.image,
        name: filename,
        type,
      } as any);
    }

    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('API response from generateImage:', data);
    
    // Ensure both URLs are present
    const result_photo = data.result_photo || data.image_url;
    const original_photo = data.original_photo;
    if (!result_photo || !original_photo) {
      console.error('No result_photo or original_photo found in API response:', data);
      throw new Error('No result or original photo returned from the server');
    }
    
    return { result_photo, original_photo };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
} 