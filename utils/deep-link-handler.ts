import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Linking } from 'react-native';

let isHandlingDeepLink = false;

export async function handleDeepLink(url: string): Promise<boolean> {
  if (isHandlingDeepLink) {
    console.log('🔗 [DeepLink] Already handling deep link, skipping');
    return false;
  }

  console.log('🔗 [DeepLink] Processing URL:', maskSensitiveData(url));
  
  try {
    isHandlingDeepLink = true;
    
    // Parse URL for auth parameters
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const accessToken = urlObj.hash.match(/access_token=([^&]*)/)?.[1];
    const refreshToken = urlObj.hash.match(/refresh_token=([^&]*)/)?.[1];
    
    console.log('🔗 [DeepLink] Parsed params:', {
      hasCode: !!code,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      urlPath: urlObj.pathname
    });

    // Check if this is a password reset flow
    const isPasswordReset = url.includes('/auth/reset-password') || url.includes('reset-password');
    
    if (!isPasswordReset) {
      console.log('🔗 [DeepLink] Not a password reset URL, skipping');
      return false;
    }

    let sessionEstablished = false;

    // Handle PKCE flow (code parameter)
    if (code) {
      console.log('🔗 [DeepLink] Attempting PKCE flow with code');
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('🔗 [DeepLink] PKCE exchange failed:', error.message);
        } else if (data.session) {
          console.log('🔗 [DeepLink] PKCE session established successfully');
          sessionEstablished = true;
        }
      } catch (err) {
        console.error('🔗 [DeepLink] PKCE exchange error:', err);
      }
    }
    // Handle implicit flow (access_token and refresh_token)
    else if (accessToken && refreshToken) {
      console.log('🔗 [DeepLink] Attempting implicit flow with tokens');
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('🔗 [DeepLink] Implicit session set failed:', error.message);
        } else if (data.session) {
          console.log('🔗 [DeepLink] Implicit session established successfully');
          sessionEstablished = true;
        }
      } catch (err) {
        console.error('🔗 [DeepLink] Implicit session set error:', err);
      }
    }
    else {
      console.log('🔗 [DeepLink] No auth parameters found in URL');
    }

    if (sessionEstablished) {
      console.log('🔗 [DeepLink] Session established, navigating to reset password');
      // Navigate to reset password screen
      router.replace('/auth/reset-password');
      return true;
    }

    console.log('🔗 [DeepLink] No session established from deep link');
    return false;
    
  } catch (error) {
    console.error('🔗 [DeepLink] Error processing deep link:', error);
    return false;
  } finally {
    isHandlingDeepLink = false;
  }
}

function maskSensitiveData(url: string): string {
  return url
    .replace(/code=([^&]*)/, 'code=***')
    .replace(/access_token=([^&]*)/, 'access_token=***')
    .replace(/refresh_token=([^&]*)/, 'refresh_token=***');
}

// Initialize deep link handling
export function initDeepLinkHandling() {
  console.log('🔗 [DeepLink] Initializing deep link handling');
  
  // Handle initial URL on app start
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('🔗 [DeepLink] Initial URL found:', maskSensitiveData(url));
      handleDeepLink(url);
    } else {
      console.log('🔗 [DeepLink] No initial URL found');
    }
  });

  // Handle URL events when app is already running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔗 [DeepLink] URL event received:', maskSensitiveData(url));
    handleDeepLink(url);
  });

  return subscription;
}
