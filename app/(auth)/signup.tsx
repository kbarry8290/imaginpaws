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
import { UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import Card from '@/components/ui/Card';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signUp(email, password);
      router.replace('/' as any);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
              Create Account 🐾
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
              Join our pet-loving community
            </Text>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

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

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Lock size={20} color={colors.placeholderText} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.placeholderText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleSignup}
              isLoading={loading}
              icon={<UserPlus size={24} color="white" />}
              style={styles.button}
            />
          </Card>

          <TouchableOpacity 
            style={styles.linkContainer}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={[styles.linkText, { color: colors.placeholderText }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
    marginTop: Layout.spacing.m,
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
});