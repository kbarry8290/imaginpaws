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
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Mail, ArrowLeft, Apple, Chrome } from 'lucide-react-native';
import Card from '@/components/ui/Card';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signInWithMagicLink, signInWithGoogle, signInWithApple } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      // Check if the error is specifically about user already existing
      if (err.message?.includes('User already registered') || 
          err.code === 'user_already_exists' ||
          (err.message && err.message.toLowerCase().includes('user already exists'))) {
        setError('It looks like you already have an account, please sign in');
      } else {
        setError(err.message || 'Failed to send magic link');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      // Check if the error is specifically about user already existing
      if (err.message?.includes('User already registered') || 
          err.code === 'user_already_exists' ||
          (err.message && err.message.toLowerCase().includes('user already exists'))) {
        setError('It looks like you already have an account, please sign in');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
    } catch (err: any) {
      // Check if the error is specifically about user already existing
      if (err.message?.includes('User already registered') || 
          err.code === 'user_already_exists' ||
          (err.message && err.message.toLowerCase().includes('user already exists'))) {
        setError('It looks like you already have an account, please sign in');
      } else {
        setError(err.message || 'Failed to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={[styles.title, { color: colors.text }]}>
              Join Pet to Person 🐾
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
              Save and share your transformations
            </Text>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {magicLinkSent ? (
            <Card>
              <View style={styles.successContainer}>
                <Text style={[styles.successTitle, { color: colors.text }]}>
                  Check your email! ✉️
                </Text>
                <Text style={[styles.successText, { color: colors.placeholderText }]}>
                  We've sent a magic link to {email}. Click the link to sign in!
                </Text>
                <Button
                  title="Send New Link"
                  onPress={handleMagicLinkSignIn}
                  variant="outline"
                  style={styles.resendButton}
                />
              </View>
            </Card>
          ) : (
            <View style={styles.form}>
              <Card>
                <View style={styles.magicLinkContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Sign in with Magic Link
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.placeholderText }]}>
                    We'll send you a link to sign in instantly
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <Mail size={20} color={colors.placeholderText} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.placeholderText}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <Button
                    title="Send Magic Link"
                    onPress={handleMagicLinkSignIn}
                    isLoading={loading}
                    icon={<Mail size={24} color="white" />}
                    style={styles.button}
                  />
                </View>
              </Card>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.placeholderText }]}>
                  or continue with
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.socialButtons}>
                <Button
                  title="Google"
                  onPress={handleGoogleSignIn}
                  variant="outline"
                  icon={<Chrome size={24} color={colors.text} />}
                  style={styles.socialButton}
                  textStyle={{ color: colors.text }}
                />
                
                {Platform.OS === 'ios' && (
                  <Button
                    title="Apple"
                    onPress={handleAppleSignIn}
                    variant="outline"
                    icon={<Apple size={24} color={colors.text} />}
                    style={styles.socialButton}
                    textStyle={{ color: colors.text }}
                  />
                )}
              </View>
            </View>
          )}
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
  backButton: {
    padding: Layout.spacing.s,
    marginBottom: Layout.spacing.m,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  form: {
    gap: Layout.spacing.l,
  },
  magicLinkContainer: {
    gap: Layout.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
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
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.m,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.m,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  socialButtons: {
    gap: Layout.spacing.m,
  },
  socialButton: {
    borderWidth: 2,
  },
  successContainer: {
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.s,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
  resendButton: {
    minWidth: 200,
  },
});