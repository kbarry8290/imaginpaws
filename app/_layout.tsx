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
import { Platform, View, Text, useColorScheme } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { AnonymousTransformationsProvider } from '@/contexts/AnonymousTransformationsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logAppStartup, logScreenView } from '@/utils/logging';
import { initMixpanel, trackEvent, checkDistinctId } from '@/utils/mixpanel';
import { initAuthListeners } from '@/utils/auth-events';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { Linking } from 'react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableNative: true,
  enableNativeCrashHandling: true,
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
    const isResetPasswordRoute = segments.some(segment => segment === 'reset-password');
    
    // Define public routes that don't require authentication
    const publicRoutes = ['welcome', 'login', 'signup', 'auth/reset-password', 'reset-password'];
    const currentPath = segments.join('/');
    const isPublicRoute = publicRoutes.some(route => currentPath.includes(route));
    
    console.log('🔗 [DeepLink] Protected route check:', { 
      user: !!user, 
      inAuthGroup, 
      inOnboardingGroup, 
      isResetPasswordRoute,
      isPublicRoute,
      segments: segments.join('/'),
      currentPath
    });
    
    // Allow access to public routes without authentication
    if (!user && isPublicRoute) {
      console.log('🔓 Allowing unauthenticated access to public route:', currentPath);
      return;
    }
    
    // Allow access to auth group routes (including reset-password) without authentication
    if (!user && inAuthGroup) {
      console.log('🔓 Allowing unauthenticated access to auth group route');
      return;
    }
    
    // Allow access to onboarding group routes without authentication
    if (!user && inOnboardingGroup) {
      console.log('🔓 Allowing unauthenticated access to onboarding group route');
      return;
    }
    
    // Redirect unauthenticated users to welcome screen
    if (!user) {
      console.log('Redirecting unauthenticated user to welcome screen');
      router.replace('/welcome');
      return;
    }
    
    // Redirect authenticated users away from auth/onboarding screens
    if (user && (inAuthGroup || inOnboardingGroup)) {
      console.log('Redirecting authenticated user to transform');
      router.replace('/(tabs)/transform' as any);
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

  useFrameworkReady();
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
  });

  useEffect(() => {
    logAppStartup();
    
    // Initialize auth listeners for password recovery
    initAuthListeners();
    
    // Log initial URL for debugging
    Linking.getInitialURL().then(url => {
      console.log('🔗 [DeepLink] Initial URL:', url);
    });
    
    // Listen for URL events
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 [DeepLink] URL event:', url);
    });
    
    const initializeMixpanel = async () => {
      try {
        console.log('🔍 [Mixpanel] Starting initialization...');
        await initMixpanel();
        console.log('✅ [Mixpanel] Initialization completed');
        
        // Check distinct ID after initialization
        checkDistinctId();
        
        // Debug: Track app started event to verify Mixpanel is working
        console.log('🔍 [Mixpanel] Sending App Started event...');
        trackEvent('App Started', { 
          appVersion: '1.0.0',
          buildNumber: '1',
          initializationTime: new Date().toISOString()
        });
        console.log('✅ [Mixpanel] App Started event sent');
      } catch (error) {
        console.error('❌ [Mixpanel] Failed to initialize:', error);
      }
    };
    
    initializeMixpanel();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const insets = useSafeAreaInsets();

  try {
    if (!fontsLoaded && !fontError) {
      console.log('Fonts not loaded yet');
      return null;
    }

    console.log('Rendering RootLayoutNav and providers');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AnonymousTransformationsProvider>
            <CreditsProvider>
              <PurchasesProvider>
                <RootLayoutNav />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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