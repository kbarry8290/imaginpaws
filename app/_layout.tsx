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
import { Platform, View } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { AnonymousTransformationsProvider } from '@/contexts/AnonymousTransformationsContext';
import * as Sentry from 'sentry-expo';
import ErrorBoundary from '@/components/ErrorBoundary';
import { attachLogsToSentry } from '@/utils/logBuffer';
import { logAppStartup, logScreenView } from '@/utils/logging';

// Initialize Sentry as early as possible
Sentry.init({
  dsn: 'https://ced6c9b06594c63ae4b474c9cc07a25f@o4509351040909312.ingest.us.sentry.io/4509351044382720',
  enableInExpoDevelopment: true,
  debug: __DEV__,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception) {
      attachLogsToSentry(event.exception.values?.[0]?.value);
    }
    return event;
  },
});

// Set up global error handlers
if (!__DEV__) {
  globalThis.addEventListener('error', (event) => {
    attachLogsToSentry(event.error);
    Sentry.Native.captureException(event.error);
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    attachLogsToSentry(event.reason);
    Sentry.Native.captureException(event.reason);
  });
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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

export default function RootLayout() {
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
    return null;
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}