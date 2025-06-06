import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAuthEvent } from '@/utils/logging';

const SESSION_KEY = 'supabase.session';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on startup
  useEffect(() => {
    loadSavedSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Save session when it changes
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        logAuthEvent('login', session.user.id);
      } else {
        // Remove session when logged out
        await AsyncStorage.removeItem(SESSION_KEY);
        logAuthEvent('logout');
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSavedSession = async () => {
    try {
      // Check for saved session
      const savedSession = await AsyncStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        
        // Verify the session is still valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Session is invalid, remove it
          await AsyncStorage.removeItem(SESSION_KEY);
          setSession(null);
          setUser(null);
        } else {
          // Session is valid
          setSession(session);
          setUser(session.user);
          logAuthEvent('login', session.user.id, { restored: true });
        }
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (data.session) {
      logAuthEvent('signup', data.session.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.session) {
      logAuthEvent('login', data.session.user.id, { method: 'password' });
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        redirectTo: 'https://imaginpaws.com/auth/callback'
      }
    });

    if (error) throw error;
    logAuthEvent('login', undefined, { method: 'magic_link', email });
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = makeRedirectUri({
        path: 'auth/callback',
        preferLocalhost: true,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            preferEphemeralSession: true,
          }
        );

        if (result.type === 'success') {
          const { url } = result;
          if (Platform.OS === 'web') {
            window.location.href = url;
          } else {
            await Linking.openURL(url);
          }
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      const redirectUrl = makeRedirectUri({
        path: 'auth/callback',
        preferLocalhost: true,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            preferEphemeralSession: true,
          }
        );

        if (result.type === 'success') {
          const { url } = result;
          if (Platform.OS === 'web') {
            window.location.href = url;
          } else {
            await Linking.openURL(url);
          }
        }
      }
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear saved session
    await AsyncStorage.removeItem(SESSION_KEY);
    logAuthEvent('logout');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithMagicLink,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}