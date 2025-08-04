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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  
  console.log('🧪 Reset password screen loaded');
  console.log('Token:', params.token);
  console.log('Type:', params.type);
  console.log('All params:', params);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateResetToken = async () => {
      const token = params.token as string;
      const type = params.type as string;

      // Check if we have the necessary parameters from the deep link
      if (type !== 'recovery' || !token) {
        setError('Invalid reset link. Please request a new password reset.');
        setValidatingToken(false);
        return;
      }

      try {
        // Validate the token with Supabase
        const { data, error } = await supabase.auth.exchangeCodeForSession(token);
        
        if (error) {
          console.error('Token validation error:', error);
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setError('This reset link has expired or is invalid. Please request a new password reset.');
          } else {
            setError('Failed to validate reset link. Please try again.');
          }
          setValidatingToken(false);
          return;
        }

        // Token is valid, allow password reset
        console.log('Reset token validated successfully');
        setValidatingToken(false);
      } catch (err: any) {
        console.error('Unexpected error validating token:', err);
        setError('An unexpected error occurred. Please try again.');
        setValidatingToken(false);
      }
    };

    validateResetToken();
  }, [params]);

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
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login' as any);
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

  if (error && (!params.token || params.type !== 'recovery')) {
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
            <Button
              title="Back to Sign In"
              onPress={handleBackToLogin}
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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