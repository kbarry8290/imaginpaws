import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import PhotoUploader from '@/components/PhotoUploader';
import { useAnonymousTransformations } from '@/contexts/AnonymousTransformationsContext';

export default function PhotoUploadScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { canTransform } = useAnonymousTransformations();
  const [photo, setPhoto] = useState<string | null>(null);

  const handleContinue = () => {
    if (photo && canTransform) {
      router.push({
        pathname: '/settings',
        params: {
          photo: photo,
        },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Pick Your Pet's Best Pic
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Choose a clear photo for the best results.
          </Text>
        </View>

        <PhotoUploader
          photo={photo}
          onPhotoSelect={setPhoto}
          buttonText={photo ? "Change Photo" : "Add Photo"}
        />

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!photo || !canTransform}
          icon={<ArrowRight size={24} color="white" />}
          style={styles.button}
        />
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
  backButton: {
    marginBottom: Layout.spacing.l,
  },
  header: {
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: Layout.spacing.xl,
  },
});