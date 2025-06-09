import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Camera, Image, ArrowLeft } from 'lucide-react-native';
import Card from '@/components/ui/Card';

export default function PermissionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handlePermissionAndNavigate = (type: 'camera' | 'library') => {
    // Permission logic will be added later
    router.push('/photo-upload');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>
            We Need a Little Help!
          </Text>
          
          <Text style={[styles.description, { color: colors.placeholderText }]}>
            To work our magic, we need permission to use your camera or photo library. Your pet's pics are private and never shared.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Take Photo"
              onPress={() => handlePermissionAndNavigate('camera')}
              icon={<Camera size={24} color="white" />}
              style={styles.button}
            />
            
            <Button
              title="Choose From Library"
              onPress={() => handlePermissionAndNavigate('library')}
              variant="secondary"
              icon={<Image size={24} color="white" />}
              style={styles.button}
            />
          </View>
        </Card>
      </ScrollView>
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
    padding: Layout.spacing.s,
  },
  card: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 24,
    maxWidth: '90%',
  },
  buttonContainer: {
    width: '100%',
    gap: Layout.spacing.m,
  },
  button: {
    width: '100%',
  },
});