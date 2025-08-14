import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackAuthEvent } from '@/utils/mixpanel';
import { ensureCreditsRow, getCredits } from '@/lib/creditsApi';

const SESSION_KEY = 'supabase.session';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
      console.log('Auth state change:', event, session ? 'session exists' : 'no session');
      
      if (session) {
        // Save session when it changes
        console.log('Saving session to AsyncStorage');
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        trackAuthEvent('login', undefined, session.user.id);
        
        // Create credits row if missing (only on sign in)
        if (event === 'SIGNED_IN') {
          try {
            console.log('Creating credits row for new user...');
            await ensureCreditsRow();
            const credits = await getCredits();
            console.log('Credits row created/fetched:', credits);
          } catch (error) {
            console.error('Error creating credits row:', error);
            // Don't fail auth if credits creation fails
          }
        }
      } else {
        // Remove session when logged out
        console.log('Removing session from AsyncStorage');
        await AsyncStorage.removeItem(SESSION_KEY);
        trackAuthEvent('logout');
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSavedSession = async () => {
    try {
      console.log('Loading saved session...');
      
      // On web, always try to get the current session from Supabase first
      if (Platform.OS === 'web') {
        console.log('Web platform detected, checking current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session on web:', error);
        } else if (session) {
          console.log('Found valid session on web:', session.user.id);
          setSession(session);
          setUser(session.user);
          trackAuthEvent('login', undefined, session.user.id);
          setLoading(false);
          return;
        }
      }
      
      // Check for saved session in AsyncStorage
      const savedSession = await AsyncStorage.getItem(SESSION_KEY);
      if (savedSession) {
        console.log('Found saved session in AsyncStorage');
        const parsedSession = JSON.parse(savedSession);
        
        // Verify the session is still valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log('Saved session is invalid, removing it');
          // Session is invalid, remove it
          await AsyncStorage.removeItem(SESSION_KEY);
          setSession(null);
          setUser(null);
        } else {
          console.log('Saved session is valid');
          // Session is valid
          setSession(session);
          setUser(session.user);
          trackAuthEvent('login', undefined, session.user.id);
          
          // Ensure credits row exists for existing session
          try {
            console.log('Ensuring credits row exists for existing session...');
            await ensureCreditsRow();
            const credits = await getCredits();
            console.log('Credits row ensured for existing session:', credits);
          } catch (error) {
            console.error('Error ensuring credits row for existing session:', error);
            // Don't fail auth if credits creation fails
          }
        }
      } else {
        console.log('No saved session found');
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
      options: {
        emailRedirectTo: 'imaginpaws://auth/callback',
      },
    });

    if (error) throw error;
    
    // If no session is created (email confirmation required), sign in immediately
    if (!data.session) {
      console.log('No session created during signup, attempting immediate sign in...');
      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('Failed to sign in after signup:', signInError);
        throw new Error('Account created but unable to sign in automatically. Please check your email for confirmation or try signing in manually.');
      }
      
      if (signInData.session) {
        trackAuthEvent('signup', undefined, signInData.session.user.id);
      }
    } else {
      trackAuthEvent('signup', undefined, data.session.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.session) {
      trackAuthEvent('login', 'password', data.session.user.id);
    }
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
    try {
      console.log('Starting sign out process...');
      
      // On web, we need to handle sign out differently
      if (Platform.OS === 'web') {
        console.log('Signing out on web platform');
        // For web, we might need to clear any stored tokens first
        await AsyncStorage.removeItem(SESSION_KEY);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      
      // Clear saved session
      await AsyncStorage.removeItem(SESSION_KEY);
      trackAuthEvent('logout');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if Supabase sign out fails, clear local session
      await AsyncStorage.removeItem(SESSION_KEY);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
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