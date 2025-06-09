import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { Camera as CameraIcon, Camera as FlipCamera, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Button from '@/components/ui/Button';

export default function TakePhotoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState<'back' | 'front' | null>(
    Platform.OS === 'web' ? null : 'back'
  );
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo && photo.uri) {
        setPhoto(photo.uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleUsePhoto = () => {
    // In a real app, you'd pass this photo back to the main screen
    // For now, we'll just navigate back
    router.back();
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Loading camera permissions...
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // No access to camera
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          We need your permission to show the camera
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          variant="primary"
          style={styles.permissionButton}
        />
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Camera capture is not fully supported on web.
        </Text>
        <Text style={[styles.subText, { color: colors.placeholderText }]}>
          Please use the image upload feature instead.
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Take Pet Photo 📸
          </Text>
          <View style={styles.placeholder} />
        </View>

        {photo ? (
          <View style={styles.photoReviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            
            <View style={styles.photoActions}>
              <Button
                title="Retake"
                onPress={handleRetake}
                variant="outline"
                style={styles.photoButton}
              />
              <Button
                title="Use Photo"
                onPress={handleUsePhoto}
                variant="primary"
                style={styles.photoButton}
              />
            </View>
          </View>
        ) : (
          <>
            {type !== null && (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={type}
              />
            )}
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.flipButton, { backgroundColor: colors.secondary }]}
                onPress={toggleCameraType}
                disabled={type === null}
              >
                <FlipCamera color="white" size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: colors.primary }]}
                onPress={takePicture}
                disabled={type === null}
              >
                <CameraIcon color="white" size={28} />
              </TouchableOpacity>
              
              <View style={styles.placeholder} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.m,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
  },
  backButtonContainer: {
    padding: Layout.spacing.s,
  },
  placeholder: {
    width: 40,
  },
  camera: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  permissionButton: {
    marginBottom: Layout.spacing.m,
  },
  backButton: {
    marginTop: Layout.spacing.m,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Layout.spacing.l,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoReviewContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Layout.spacing.m,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.l,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  photoButton: {
    minWidth: 120,
  },
});