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
import { LogIn, Mail, Lock, Wand as Wand2 } from 'lucide-react-native';
import Card from '@/components/ui/Card';

type AuthMode = 'magic-link' | 'password';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signIn, signInWithMagicLink } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (authMode === 'password' && !password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (authMode === 'password') {
        await signIn(email, password);
        router.replace('/');
      } else {
        await signInWithMagicLink(email);
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(current => current === 'magic-link' ? 'password' : 'magic-link');
    setError(null);
    setPassword('');
    setMagicLinkSent(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back! 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
              {authMode === 'magic-link' 
                ? "Enter your email to receive a magic link"
                : "Sign in with your email and password"
              }
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
                  onPress={handleLogin}
                  variant="outline"
                  style={styles.resendButton}
                />
              </View>
            </Card>
          ) : (
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
                    />
                  </View>
                </View>

                {authMode === 'password' && (
                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <Lock size={20} color={colors.placeholderText} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Password"
                        placeholderTextColor={colors.placeholderText}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>
                )}

                <Button
                  title={authMode === 'magic-link' ? "Send Magic Link" : "Sign In"}
                  onPress={handleLogin}
                  isLoading={loading}
                  icon={authMode === 'magic-link' ? 
                    <Wand2 size={24} color="white" /> : 
                    <LogIn size={24} color="white" />
                  }
                  style={styles.button}
                />

                <TouchableOpacity 
                  style={styles.toggleContainer}
                  onPress={toggleAuthMode}
                >
                  <Text style={[styles.toggleText, { color: colors.placeholderText }]}>
                    {authMode === 'magic-link' ? 
                      "Use password instead" : 
                      "Use magic link instead"
                    }
                  </Text>
                </TouchableOpacity>
              </Card>

              <TouchableOpacity 
                style={styles.linkContainer}
                onPress={() => router.push('/signup')}
              >
                <Text style={[styles.linkText, { color: colors.placeholderText }]}>
                  Don't have an account?{' '}
                  <Text style={{ color: colors.primary }}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
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
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.m,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.m,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  toggleContainer: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textDecorationLine: 'underline',
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