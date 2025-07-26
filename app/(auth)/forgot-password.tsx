import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'imaginpaws://reset-password',
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <CheckCircle size={64} color={colors.success || '#10B981'} />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.successMessage, { color: colors.placeholderText }]}>
              We've sent a password reset link to:
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>
              {email}
            </Text>
            <Text style={[styles.successMessage, { color: colors.placeholderText }]}>
              Click the link in your email to reset your password.
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
            <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
              Enter your email address and we'll send you a link to reset your password
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
                  <Mail size={20} color={colors.placeholderText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={colors.placeholderText}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />
                </View>
              </View>
              
              <Button
                title="Send Reset Link"
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
    marginBottom: Layout.spacing.s,
  },
  emailText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
}); 