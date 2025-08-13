import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Linking } from 'react-native';

/**
 * Normalizes Supabase URLs by replacing the first # with ?
 * Supabase uses hash fragments, but Expo Router/React Navigation expect query parameters
 */
export function parseSupabaseUrl(url: string): string {
  console.log('🔗 [SupabaseAuth] Original URL:', maskSensitiveData(url));
  
  // Replace first # with ? to convert hash fragment to query parameters
  const normalizedUrl = url.replace('#', '?');
  
  console.log('🔗 [SupabaseAuth] Normalized URL:', maskSensitiveData(normalizedUrl));
  return normalizedUrl;
}

/**
 * Extracts access_token and refresh_token from a URL
 */
export function extractTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check for tokens in query parameters (after normalization)
    const access_token = urlObj.searchParams.get('access_token');
    const refresh_token = urlObj.searchParams.get('refresh_token');
    
    // Also check for tokens in hash fragment (original format)
    const hashMatch = url.match(/#access_token=([^&]*)&refresh_token=([^&]*)/);
    const hashAccessToken = hashMatch?.[1];
    const hashRefreshToken = hashMatch?.[2];
    
    const tokens = {
      access_token: access_token || hashAccessToken,
      refresh_token: refresh_token || hashRefreshToken,
    };
    
    console.log('🔗 [SupabaseAuth] Extracted tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });
    
    return tokens;
  } catch (error) {
    console.error('🔗 [SupabaseAuth] Error extracting tokens:', error);
    return {};
  }
}

/**
 * Performs token-based login using Supabase session
 */
export async function performTokenBasedLogin(access_token: string, refresh_token: string): Promise<boolean> {
  console.log('🔗 [SupabaseAuth] Attempting token-based login');
  
  try {
    // Set the session with the tokens
    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (setSessionError) {
      console.error('🔗 [SupabaseAuth] setSession failed:', setSessionError.message);
      return false;
    }
    
    if (!setSessionData.session) {
      console.error('🔗 [SupabaseAuth] No session returned from setSession');
      return false;
    }
    
    console.log('🔗 [SupabaseAuth] Session set successfully, user ID:', setSessionData.session.user.id);
    
    // Optionally refresh the session to ensure it's valid
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.warn('🔗 [SupabaseAuth] Session refresh failed, but continuing:', refreshError.message);
    } else {
      console.log('🔗 [SupabaseAuth] Session refreshed successfully');
    }
    
    return true;
  } catch (error) {
    console.error('🔗 [SupabaseAuth] Token-based login error:', error);
    return false;
  }
}

/**
 * Handles incoming URLs for Supabase authentication flows
 */
export async function handleSupabaseAuthUrl(url: string): Promise<boolean> {
  console.log('🔗 [SupabaseAuth] Processing Supabase auth URL');
  
  try {
    // Normalize the URL
    const normalizedUrl = parseSupabaseUrl(url);
    
    // Extract tokens
    const { access_token, refresh_token } = extractTokensFromUrl(normalizedUrl);
    
    // Check if this is a password reset URL
    const isPasswordReset = url.includes('/auth/reset-password') || 
                           url.includes('reset-password') ||
                           url.includes('type=recovery');
    
    console.log('🔗 [SupabaseAuth] URL analysis:', {
      isPasswordReset,
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
    });
    
    // If we have both tokens, attempt token-based login
    if (access_token && refresh_token) {
      const loginSuccess = await performTokenBasedLogin(access_token, refresh_token);
      
      if (loginSuccess) {
        console.log('🔗 [SupabaseAuth] Token-based login successful');
        
        // Navigate to appropriate screen based on URL type
        if (isPasswordReset) {
          console.log('🔗 [SupabaseAuth] Navigating to reset password screen');
          router.replace('/auth/reset-password');
        } else {
          console.log('🔗 [SupabaseAuth] Navigating to transform screen');
          router.replace('/(tabs)/transform');
        }
        
        return true;
      } else {
        console.error('🔗 [SupabaseAuth] Token-based login failed');
        return false;
      }
    }
    
    // Check for code parameter (PKCE flow)
    const urlObj = new URL(normalizedUrl);
    const code = urlObj.searchParams.get('code');
    
    if (code) {
      console.log('🔗 [SupabaseAuth] Found code parameter, attempting PKCE flow');
      
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('🔗 [SupabaseAuth] PKCE exchange failed:', error.message);
          return false;
        }
        
        if (data.session) {
          console.log('🔗 [SupabaseAuth] PKCE session established successfully');
          
          if (isPasswordReset) {
            console.log('🔗 [SupabaseAuth] Navigating to reset password screen');
            router.replace('/auth/reset-password');
          } else {
            console.log('🔗 [SupabaseAuth] Navigating to transform screen');
            router.replace('/(tabs)/transform');
          }
          
          return true;
        }
      } catch (err) {
        console.error('🔗 [SupabaseAuth] PKCE exchange error:', err);
        return false;
      }
    }
    
    console.log('🔗 [SupabaseAuth] No valid authentication parameters found');
    return false;
    
  } catch (error) {
    console.error('🔗 [SupabaseAuth] Error handling Supabase auth URL:', error);
    return false;
  }
}

/**
 * Masks sensitive data in URLs for logging
 */
function maskSensitiveData(url: string): string {
  return url
    .replace(/access_token=([^&]*)/, 'access_token=***')
    .replace(/refresh_token=([^&]*)/, 'refresh_token=***')
    .replace(/code=([^&]*)/, 'code=***');
}

/**
 * Initializes Supabase authentication URL handling
 */
export function initSupabaseAuthHandling() {
  console.log('🔗 [SupabaseAuth] Initializing Supabase auth handling');
  
  // Handle initial URL on app start
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('🔗 [SupabaseAuth] Initial URL found:', maskSensitiveData(url));
      handleSupabaseAuthUrl(url);
    } else {
      console.log('🔗 [SupabaseAuth] No initial URL found');
    }
  });
  
  // Subscribe to URL events
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔗 [SupabaseAuth] URL event received:', maskSensitiveData(url));
    handleSupabaseAuthUrl(url);
  });
  
  return subscription;
}
