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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import Card from '@/components/ui/Card';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
      router.replace('/(tabs)/transform' as any);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
          
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back! 👋</Text>
            <Text style={[styles.subtitle, { color: colors.placeholderText }]}>Sign in with your email and password</Text>
          </View>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}> 
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
              <Button
                title="Sign In"
                onPress={handleLogin}
                isLoading={loading}
                icon={<LogIn size={24} color="white" />}
                style={styles.button}
              />
            </Card>
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkContainer}
              onPress={() => router.push('/(auth)/signup' as any)}
            >
              <Text style={[styles.linkText, { color: colors.placeholderText }]}> 
                Don't have an account?{' '}
                <Text style={{ color: colors.primary }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.s,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  backButton: {
    marginBottom: Layout.spacing.l,
    padding: Layout.spacing.s,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  logo: {
    width: 150,
    height: 50,
  },
});