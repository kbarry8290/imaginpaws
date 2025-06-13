import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { 
  Nunito_400Regular, 
  Nunito_700Bold,
  Nunito_800ExtraBold
} from '@expo-google-fonts/nunito';
import { SplashScreen } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { AnonymousTransformationsProvider } from '@/contexts/AnonymousTransformationsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logAppStartup, logScreenView } from '@/utils/logging';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: true,
  debug: false,
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Add this at the very top
console.log('App starting: _layout.tsx loaded');

function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    
    if (!user && !inAuthGroup && !inOnboardingGroup) {
      router.replace('/welcome');
    } else if (user && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/');
    }
  }, [user, segments]);

  useEffect(() => {
    if (segments.length > 0) {
      logScreenView(segments.join('/'));
    }
  }, [segments]);
}

function RootLayoutNav() {
  const { user } = useAuth();
  
  useProtectedRoute(user);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Add global error handler
if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('Global error handler:', error, 'isFatal:', isFatal);
    throw error;
  });
}

export default function RootLayout() {
  console.log('RootLayout function invoked');
  try {
    useFrameworkReady();

    const [fontsLoaded, fontError] = useFonts({
      'Nunito-Regular': Nunito_400Regular,
      'Nunito-Bold': Nunito_700Bold,
      'Nunito-ExtraBold': Nunito_800ExtraBold,
    });

    useEffect(() => {
      logAppStartup();
    }, []);

    useEffect(() => {
      if (fontsLoaded || fontError) {
        SplashScreen.hideAsync();
      }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
      console.log('Fonts not loaded yet');
      return null;
    }

    const insets = useSafeAreaInsets();

    console.log('Rendering RootLayoutNav and providers');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AnonymousTransformationsProvider>
            <CreditsProvider>
              <PurchasesProvider>
                <RootLayoutNav />
                <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
              </PurchasesProvider>
            </CreditsProvider>
          </AnonymousTransformationsProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    );
  } catch (err: any) {
    console.log('Error rendering RootLayout:', err);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center' }}>
          App crashed: {err && err.message ? err.message : String(err)}
        </Text>
      </View>
    );
  }
}