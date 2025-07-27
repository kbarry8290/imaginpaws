import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import ResultCard from '@/components/ResultCard';
import { TransformSettings } from '@/components/TransformOptions';
import { useColorScheme } from 'react-native';
import { History, Wand as Wand2, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';

export default function ResultsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { credits } = useCredits();
  const params = useLocalSearchParams();
  const originalPhoto = params.originalPhoto as string | undefined;
  const resultPhoto = params.resultPhoto as string | undefined;
  let settings: TransformSettings | null = null;
  if (params.settings) {
    try {
      settings = JSON.parse(params.settings as string);
    } catch (err) {
      settings = null;
    }
  }

  if (!originalPhoto || !resultPhoto || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Missing or invalid transformation data. Please try again.</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main results UI
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: Layout.spacing.l }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ marginBottom: Layout.spacing.l }}>
          <Text style={[styles.title, { color: colors.text }]}>🎉 All done! Meet your masterpiece.</Text>
        </View>
        <ResultCard
          originalPhoto={originalPhoto}
          resultPhoto={resultPhoto}
          settings={settings}
          isLoading={false}
        />
        <Text style={[styles.subtext, { color: colors.placeholderText }]}>Is it magic or just really smart tech? Either way, your pet looks amazing.</Text>
        <View style={styles.buttonsContainer}>
          <Button
            title="New Transformation"
            onPress={() => router.replace('/(tabs)/transform')}
            icon={<Wand2 size={24} color="white" />}
            style={styles.button}
          />
          <Button
            title="View History"
            onPress={() => router.push('/gallery')}
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
  button: {
    marginBottom: Layout.spacing.s,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.l,
    textAlign: 'center',
  },
  creditsContainer: {
    alignItems: 'center',
    marginVertical: Layout.spacing.m,
  },
  creditsText: {
    fontSize: 16,
  },
  buttonsContainer: {
    gap: Layout.spacing.m,
    marginTop: Layout.spacing.l,
  },
  subtext: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginVertical: Layout.spacing.l,
  },
  backButton: {
    marginBottom: Layout.spacing.l,
    alignSelf: 'flex-start',
    padding: 8,
  },
}); 