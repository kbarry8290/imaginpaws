import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { logInfo, logWarn, logError, time, duration, DEBUG_DIAGNOSTICS } from '@/utils/DebugLogger';

/**
 * Normalizes Supabase URLs by replacing the first # with ?
 * Supabase uses hash fragments, but Expo Router/React Navigation expect query parameters
 */
export function parseSupabaseUrl(url: string): string {
  if (DEBUG_DIAGNOSTICS) {
    logInfo('SUPABASE_AUTH', 'Original URL', { url: maskSensitiveData(url) });
  }
  
  // Replace first # with ? to convert hash fragment to query parameters
  const normalizedUrl = url.replace('#', '?');
  
  if (DEBUG_DIAGNOSTICS) {
    logInfo('SUPABASE_AUTH', 'Normalized URL', { 
      original: maskSensitiveData(url),
      normalized: maskSensitiveData(normalizedUrl),
      changed: url !== normalizedUrl
    });
  }
  
  return normalizedUrl;
}

/**
 * Extracts access_token and refresh_token from a URL
 */
export function extractTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const startTime = time();
  
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
    
    if (DEBUG_DIAGNOSTICS) {
      logInfo('SUPABASE_AUTH', 'Extracted tokens', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        source: access_token ? 'query' : hashAccessToken ? 'hash' : 'none',
        duration: duration(startTime)
      });
    }
    
    return tokens;
  } catch (error) {
    if (DEBUG_DIAGNOSTICS) {
      logError('SUPABASE_AUTH', 'Error extracting tokens', { 
        error: error instanceof Error ? error.message : String(error),
        duration: duration(startTime)
      });
    }
    return {};
  }
}

/**
 * Performs token-based login using Supabase session
 */
export async function performTokenBasedLogin(access_token: string, refresh_token: string): Promise<boolean> {
  const startTime = time();
  
  if (DEBUG_DIAGNOSTICS) {
    logInfo('SUPABASE_AUTH', 'AUTH_SETSESSION_START', { startTime });
  }
  
  try {
    // Set the session with the tokens
    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (setSessionError) {
      if (DEBUG_DIAGNOSTICS) {
        logError('SUPABASE_AUTH', 'AUTH_SETSESSION_ERR', { 
          error: setSessionError.message,
          duration: duration(startTime)
        });
      }
      return false;
    }
    
    if (!setSessionData.session) {
      if (DEBUG_DIAGNOSTICS) {
        logError('SUPABASE_AUTH', 'AUTH_SETSESSION_ERR', { 
          error: 'No session returned from setSession',
          duration: duration(startTime)
        });
      }
      return false;
    }
    
    if (DEBUG_DIAGNOSTICS) {
      logInfo('SUPABASE_AUTH', 'AUTH_SETSESSION_OK', {
        userId: setSessionData.session.user.id,
        duration: duration(startTime)
      });
    }
    
    // Optionally refresh the session to ensure it's valid
    const refreshStartTime = time();
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      if (DEBUG_DIAGNOSTICS) {
        logWarn('SUPABASE_AUTH', 'AUTH_REFRESH_ERR', { 
          error: refreshError.message,
          duration: duration(refreshStartTime)
        });
      }
    } else {
      if (DEBUG_DIAGNOSTICS) {
        logInfo('SUPABASE_AUTH', 'AUTH_REFRESH_OK', {
          duration: duration(refreshStartTime)
        });
      }
    }
    
    return true;
  } catch (error) {
    if (DEBUG_DIAGNOSTICS) {
      logError('SUPABASE_AUTH', 'Token-based login error', { 
        error: error instanceof Error ? error.message : String(error),
        duration: duration(startTime)
      });
    }
    return false;
  }
}

/**
 * Handles incoming URLs for Supabase authentication flows
 */
export async function handleSupabaseAuthUrl(url: string): Promise<boolean> {
  const startTime = time();
  
  if (DEBUG_DIAGNOSTICS) {
    logInfo('SUPABASE_AUTH', 'AUTH_DL_START', { url: maskSensitiveData(url) });
  }
  
  try {
    // Normalize the URL
    const normalizedUrl = parseSupabaseUrl(url);
    
    // Extract tokens
    const { access_token, refresh_token } = extractTokensFromUrl(normalizedUrl);
    
    // Check if this is a password reset URL
    const isPasswordReset = url.includes('/auth/reset-password') || 
                           url.includes('reset-password') ||
                           url.includes('type=recovery');
    
    if (DEBUG_DIAGNOSTICS) {
      logInfo('SUPABASE_AUTH', 'DEEPLINK_PARSED', {
        isPasswordReset,
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        duration: duration(startTime)
      });
    }
    
    // If we have both tokens, attempt token-based login
    if (access_token && refresh_token) {
      const loginSuccess = await performTokenBasedLogin(access_token, refresh_token);
      
      if (loginSuccess) {
        if (DEBUG_DIAGNOSTICS) {
          logInfo('SUPABASE_AUTH', 'Token-based login successful', { duration: duration(startTime) });
        }
        
        // Navigate to appropriate screen based on URL type
        if (isPasswordReset) {
          if (DEBUG_DIAGNOSTICS) {
            logInfo('SUPABASE_AUTH', 'NAV_TO', { route: '/auth/reset-password' });
          }
          router.replace('/auth/reset-password');
        } else {
          if (DEBUG_DIAGNOSTICS) {
            logInfo('SUPABASE_AUTH', 'NAV_TO', { route: '/(tabs)/transform' });
          }
          router.replace('/(tabs)/transform');
        }
        
        return true;
      } else {
        if (DEBUG_DIAGNOSTICS) {
          logError('SUPABASE_AUTH', 'Token-based login failed', { duration: duration(startTime) });
        }
        return false;
      }
    }
    
    // Check for code parameter (PKCE flow)
    const urlObj = new URL(normalizedUrl);
    const code = urlObj.searchParams.get('code');
    
    if (code) {
      if (DEBUG_DIAGNOSTICS) {
        logInfo('SUPABASE_AUTH', 'AUTH_PKCE_EXCHANGE_START', { hasCode: !!code });
      }
      
      try {
        const pkceStartTime = time();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          if (DEBUG_DIAGNOSTICS) {
            logError('SUPABASE_AUTH', 'AUTH_PKCE_EXCHANGE_ERR', { 
              error: error.message,
              duration: duration(pkceStartTime)
            });
          }
          return false;
        }
        
        if (data.session) {
          if (DEBUG_DIAGNOSTICS) {
            logInfo('SUPABASE_AUTH', 'AUTH_PKCE_EXCHANGE_OK', {
              userId: data.session.user.id,
              duration: duration(pkceStartTime)
            });
          }
          
          if (isPasswordReset) {
            if (DEBUG_DIAGNOSTICS) {
              logInfo('SUPABASE_AUTH', 'NAV_TO', { route: '/auth/reset-password' });
            }
            router.replace('/auth/reset-password');
          } else {
            if (DEBUG_DIAGNOSTICS) {
              logInfo('SUPABASE_AUTH', 'NAV_TO', { route: '/(tabs)/transform' });
            }
            router.replace('/(tabs)/transform');
          }
          
          return true;
        }
      } catch (err) {
        if (DEBUG_DIAGNOSTICS) {
          logError('SUPABASE_AUTH', 'PKCE exchange error', { 
            error: err instanceof Error ? err.message : String(err)
          });
        }
        return false;
      }
    }
    
    if (DEBUG_DIAGNOSTICS) {
      logWarn('SUPABASE_AUTH', 'DEEPLINK_NO_CREDS', { duration: duration(startTime) });
    }
    return false;
    
  } catch (error) {
    if (DEBUG_DIAGNOSTICS) {
      logError('SUPABASE_AUTH', 'DEEPLINK_ERROR', { 
        error: error instanceof Error ? error.message : String(error),
        duration: duration(startTime)
      });
    }
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
  if (DEBUG_DIAGNOSTICS) {
    logInfo('SUPABASE_AUTH', 'Initializing Supabase auth handling');
  }
  
  // Handle initial URL on app start
  Linking.getInitialURL().then(url => {
    if (url) {
      if (DEBUG_DIAGNOSTICS) {
        logInfo('SUPABASE_AUTH', 'DEEPLINK_RECEIVED', { 
          type: 'initial',
          url: maskSensitiveData(url)
        });
      }
      handleSupabaseAuthUrl(url);
    } else {
      if (DEBUG_DIAGNOSTICS) {
        logInfo('SUPABASE_AUTH', 'No initial URL found');
      }
    }
  });
  
  // Subscribe to URL events
  const subscription = Linking.addEventListener('url', ({ url }) => {
    if (DEBUG_DIAGNOSTICS) {
      logInfo('SUPABASE_AUTH', 'DEEPLINK_RECEIVED', { 
        type: 'runtime',
        url: maskSensitiveData(url)
      });
    }
    handleSupabaseAuthUrl(url);
  });
  
  return subscription;
}
