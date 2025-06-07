import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Sentry from 'sentry-expo';
import Button from './ui/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { attachLogsToSentry } from '@/utils/logBuffer';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Attach console logs before sending to Sentry
    attachLogsToSentry(error);
    
    try {
      if (Platform.OS === 'web') {
        Sentry.Browser?.captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      } else {
        Sentry.Native?.captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }
    } catch (sentryError) {
      console.warn('Failed to capture exception with Sentry:', sentryError);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    // Force reload the app
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReload={this.handleReload} error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onReload, error }: { onReload: () => void; error: Error | null }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Oops! Something went wrong 😅</Text>
      <Text style={[styles.message, { color: colors.placeholderText }]}>
        We're sorry, but something unexpected happened. Our team has been notified and is working on it.
      </Text>
      {__DEV__ && error && (
        <Text style={[styles.errorDetails, { color: colors.error }]}>
          {error.toString()}
        </Text>
      )}
      <Button
        title="Reload App"
        onPress={onReload}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
  errorDetails: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  button: {
    minWidth: 200,
  },
});

export default ErrorBoundary;