import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { History, Wand as Wand2 } from 'lucide-react-native';
import ResultCard from '@/components/ResultCard';
import { TransformSettings } from '@/components/TransformOptions';

export default function ResultsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{
    originalPhoto: string;
    resultPhoto: string;
    settings: string;
  }>();

  const settings: TransformSettings = params.settings ? JSON.parse(params.settings) : null;

  const handleNewTransform = () => {
    router.replace('/');
  };

  const handleViewHistory = () => {
    router.push('/gallery');
  };

  if (!params.originalPhoto || !params.resultPhoto || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No transformation results found
          </Text>
          <Button
            title="Start New Transformation"
            onPress={handleNewTransform}
            icon={<Wand2 size={24} color="white" />}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Transformation Complete! 🎉
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Your pet has been transformed into a human
          </Text>
        </View>

        <ResultCard
          originalPhoto={params.originalPhoto}
          resultPhoto={params.resultPhoto}
          settings={settings}
          isLoading={false}
        />

        <View style={styles.buttonsContainer}>
          <Button
            title="New Transformation"
            onPress={handleNewTransform}
            icon={<Wand2 size={24} color="white" />}
            style={styles.button}
          />
          <Button
            title="View History"
            onPress={handleViewHistory}
            variant="secondary"
            icon={<History size={24} color="white" />}
            style={styles.button}
          />
        </View>
      </ScrollView>
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
  },
  header: {
    marginBottom: Layout.spacing.l,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: Layout.spacing.m,
    marginTop: Layout.spacing.l,
  },
  button: {
    marginBottom: Layout.spacing.s,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
});