import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import PasswordResetDebug from '@/components/PasswordResetDebug';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  console.log('🔗 [Reset] Reset password screen loaded');
  console.log('🔗 [Reset] No longer expecting token/type from URL params');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No longer need early validation - Supabase handles the session
  console.log('🔗 [Reset] Screen loaded, checking for recovery session');

  useEffect(() => {
    const checkRecoverySession = async () => {
      console.log('🔗 [Reset] Checking for recovery session');
      
      try {
        // Check if we have a session (should be created by the email link)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔗 [Reset] Session check result:', { 
          hasSession: !!session, 
          hasError: !!error,
          errorMessage: error?.message,
          sessionUserId: session?.user?.id
        });
        
        if (error) {
          console.error('🔗 [Reset] Session check error:', error);
          setError('Failed to validate reset session. Please try again.');
          setValidatingToken(false);
          return;
        }

        if (!session) {
          console.log('🔗 [Reset] No session found - showing invalid link message');
          setError('This password reset link is invalid or has expired. Please request a new password reset.');
          setValidatingToken(false);
          return;
        }

        // Session exists, allow password reset
        console.log('🔗 [Reset] Recovery session found, allowing password reset');
        console.log('🔗 [Reset] Session details:', {
          userId: session.user.id,
          email: session.user.email
        });
        setValidatingToken(false);
      } catch (err: any) {
        console.error('🔗 [Reset] Unexpected error checking session:', err);
        setError('An unexpected error occurred. Please try again.');
        setValidatingToken(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleResetPassword = async () => {
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 [Reset] Attempting to update password');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      console.log('🔗 [Reset] Update password result:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        console.error('🔗 [Reset] Password update error:', error);
        throw error;
      }

      console.log('🔗 [Reset] Password updated successfully');
      setSuccess(true);
      
      // Navigate to sign-in with success flag
      setTimeout(() => {
        router.replace('/auth/login?reset=success' as any);
      }, 2000);
    } catch (err: any) {
      console.error('🔗 [Reset] Password reset failed:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login' as any);
  };

  const handleResendReset = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: This would need the user's email, which we don't have in this context
      // In a real implementation, you might want to navigate to a "forgot password" screen
      // or store the email in the session/user data
      console.log('🔗 [Reset] Resend reset requested');
      setError('Please go back to the login screen and use "Forgot Password" to request a new reset link.');
    } catch (err: any) {
      setError('Failed to resend reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Validating reset link...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <CheckCircle size={64} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Password Reset Successfully!
            </Text>
            <Text style={[styles.successMessage, { color: colors.placeholderText }]}>
              Your password has been updated. You can now sign in with your new password.
            </Text>
            <Button
              title="Sign In"
              onPress={handleBackToLogin}
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <AlertCircle size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Invalid Reset Link
            </Text>
            <Text style={[styles.errorMessage, { color: colors.placeholderText }]}>
              {error}
            </Text>
            <View style={{ flexDirection: 'row', gap: Layout.spacing.m, marginTop: Layout.spacing.l }}>
              <Button
                title="Back to Sign In"
                onPress={handleBackToLogin}
                style={[styles.button, { flex: 1 }]}
                variant="outline"
              />
              <Button
                title="Request New Link"
                onPress={handleResendReset}
                style={[styles.button, { flex: 1 }]}
                isLoading={loading}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PasswordResetDebug />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
              Enter your new password below
            </Text>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}> 
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Card style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}> 
                  <Lock size={20} color={colors.placeholderText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="New Password"
                    placeholderTextColor={colors.placeholderText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoFocus
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}> 
                  <Lock size={20} color={colors.placeholderText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Confirm New Password"
                    placeholderTextColor={colors.placeholderText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                isLoading={loading}
                style={styles.button}
              />
            </Card>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: Layout.spacing.m,
  },
  formCard: {
    gap: Layout.spacing.m,
  },
  inputContainer: {
    gap: Layout.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.m,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: Layout.spacing.m,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  button: {
    marginTop: Layout.spacing.s,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.s,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  backButton: {
    marginBottom: Layout.spacing.l,
    padding: Layout.spacing.s,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.l,
  },
  errorTitle: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.l,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
}); 