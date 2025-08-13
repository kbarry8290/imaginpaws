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
import { logInfo, logWarn, logError, time, duration, DEBUG_DIAGNOSTICS } from '@/utils/DebugLogger';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  if (DEBUG_DIAGNOSTICS) {
    logInfo('RESET_PASSWORD', 'Screen loaded');
  }
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRecoverySession = async () => {
      const startTime = time();
      
      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'AUTH_UPDATE_PW_START', { startTime });
      }
      
      try {
        // Check if we have a session (should be created by the email link)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (DEBUG_DIAGNOSTICS) {
          logInfo('RESET_PASSWORD', 'Session check result', { 
            hasSession: !!session, 
            hasError: !!error,
            errorMessage: error?.message,
            sessionUserId: session?.user?.id,
            duration: duration(startTime)
          });
        }
        
        if (error) {
          if (DEBUG_DIAGNOSTICS) {
            logError('RESET_PASSWORD', 'Session check error', { 
              error: error.message,
              duration: duration(startTime)
            });
          }
          setError('Failed to validate reset session. Please try again.');
          setValidatingToken(false);
          return;
        }

        if (!session) {
          if (DEBUG_DIAGNOSTICS) {
            logWarn('RESET_PASSWORD', 'No session found', { duration: duration(startTime) });
          }
          setError('This password reset link is invalid or has expired. Please request a new password reset.');
          setValidatingToken(false);
          return;
        }

        // Session exists, allow password reset
        if (DEBUG_DIAGNOSTICS) {
          logInfo('RESET_PASSWORD', 'Recovery session found', {
            userId: session.user.id,
            email: session.user.email,
            duration: duration(startTime)
          });
        }
        setValidatingToken(false);
      } catch (err: any) {
        if (DEBUG_DIAGNOSTICS) {
          logError('RESET_PASSWORD', 'Unexpected error checking session', { 
            error: err.message,
            duration: duration(startTime)
          });
        }
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
      
      const startTime = time();
      
      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'AUTH_UPDATE_PW_START', { startTime });
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'Update password result', { 
          hasData: !!data, 
          hasError: !!error,
          errorMessage: error?.message,
          duration: duration(startTime)
        });
      }

      if (error) {
        if (DEBUG_DIAGNOSTICS) {
          logError('RESET_PASSWORD', 'AUTH_UPDATE_PW_ERR', { 
            error: error.message,
            duration: duration(startTime)
          });
        }
        throw error;
      }

      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'AUTH_UPDATE_PW_OK', { duration: duration(startTime) });
      }
      setSuccess(true);
      
      // Sign out the user to clear the recovery session
      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'Signing out to clear recovery session');
      }
      await supabase.auth.signOut();
      
      if (DEBUG_DIAGNOSTICS) {
        logInfo('RESET_PASSWORD', 'AUTH_SIGNOUT_OK');
      }
      
      // Navigate to sign-in with success flag
      setTimeout(() => {
        if (DEBUG_DIAGNOSTICS) {
          logInfo('RESET_PASSWORD', 'NAV_TO', { route: '/(auth)/login?reset=success' });
        }
        router.replace('/(auth)/login?reset=success' as any);
      }, 2000);
    } catch (err: any) {
      if (DEBUG_DIAGNOSTICS) {
        logError('RESET_PASSWORD', 'Password reset failed', { 
          error: err.message
        });
      }
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    console.log('🔗 [Reset] User going back to login, clearing recovery session');
    // Sign out to clear the recovery session
    await supabase.auth.signOut();
    router.replace('/(auth)/login' as any);
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
      {/* <PasswordResetDebug /> */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
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