import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { version as appVersion } from '../package.json';

// Get device info
const deviceInfo = {
  os: Platform.OS,
  osVersion: Platform.Version,
  appVersion,
  deviceName: Constants.deviceName,
  isDevice: Constants.isDevice,
  ...Platform.select({
    web: {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    },
    default: {},
  }),
};

// Helper function to safely log breadcrumbs
const logBreadcrumb = (breadcrumb: {
  category: string;
  message: string;
  level: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) => {
  try {
    if (Platform.OS === 'web') {
      // Use Browser SDK for web
      Sentry.Browser?.addBreadcrumb({
        ...breadcrumb,
        timestamp: Date.now() / 1000, // Sentry expects seconds
      });
    } else {
      // Use Native SDK for mobile
      Sentry.Native?.addBreadcrumb({
        ...breadcrumb,
        data: {
          ...breadcrumb.data,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.warn('Failed to log breadcrumb:', error);
  }
};

// Helper function to safely set user
const setUser = (user: { id: string } | null) => {
  try {
    if (Platform.OS === 'web') {
      Sentry.Browser?.setUser(user);
    } else {
      Sentry.Native?.setUser(user);
    }
  } catch (error) {
    console.warn('Failed to set user:', error);
  }
};

// Helper function to safely capture exception
const captureException = (error: Error, extras?: { extra: Record<string, any> }) => {
  try {
    if (Platform.OS === 'web') {
      Sentry.Browser?.captureException(error, extras);
    } else {
      Sentry.Native?.captureException(error, extras);
    }
  } catch (sentryError) {
    console.warn('Failed to capture exception:', sentryError);
  }
};

// App lifecycle events
export function logAppStartup() {
  logBreadcrumb({
    category: 'app.lifecycle',
    message: 'App started',
    level: 'info',
    data: {
      ...deviceInfo,
    },
  });
}

// Auth events
export function logAuthEvent(
  event: 'login' | 'signup' | 'logout', 
  userId?: string, 
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'auth',
    message: `User ${event}`,
    level: 'info',
    data: {
      userId,
      ...details,
      ...deviceInfo,
    },
  });

  // Set user context when logging in/out
  if (event === 'login' && userId) {
    setUser({ id: userId });
  } else if (event === 'logout') {
    setUser(null);
  }
}

// Purchase events
export function logPurchaseEvent(
  event: 'started' | 'completed' | 'failed',
  productId: string,
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'purchase',
    message: `Purchase ${event}: ${productId}`,
    level: event === 'failed' ? 'error' : 'info',
    data: {
      productId,
      ...details,
      ...deviceInfo,
    },
  });
}

// Image transformation events
export function logTransformEvent(
  event: 'started' | 'completed' | 'failed',
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'transform',
    message: `Image transformation ${event}`,
    level: event === 'failed' ? 'error' : 'info',
    data: {
      ...details,
      ...deviceInfo,
    },
  });
}

// Navigation events
export function logScreenView(screenName: string) {
  logBreadcrumb({
    category: 'navigation',
    message: `Screen viewed: ${screenName}`,
    level: 'info',
    data: {
      screen: screenName,
      ...deviceInfo,
    },
  });
}

// API calls
export function logApiCall(
  method: string,
  endpoint: string,
  status?: number,
  error?: any,
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'api',
    message: `${method} ${endpoint}`,
    level: error ? 'error' : 'info',
    data: {
      method,
      endpoint,
      status,
      error: error ? error.message : undefined,
      ...details,
      ...deviceInfo,
    },
  });
}

// User interactions
export function logUserInteraction(
  action: string,
  element: string,
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'ui.interaction',
    message: `User interaction: ${action} on ${element}`,
    level: 'info',
    data: {
      action,
      element,
      ...details,
      ...deviceInfo,
    },
  });
}

// Error events
export function logError(
  error: Error, 
  context?: Record<string, any>
) {
  // Add breadcrumb for the error
  logBreadcrumb({
    category: 'error',
    message: error.message,
    level: 'error',
    data: {
      name: error.name,
      stack: error.stack,
      ...context,
      ...deviceInfo,
    },
  });

  // Capture the exception with device info
  captureException(error, {
    extra: {
      ...context,
      deviceInfo,
    },
  });
}

// Performance monitoring
export function logPerformanceEvent(
  name: string,
  duration: number,
  details?: Record<string, any>
) {
  logBreadcrumb({
    category: 'performance',
    message: `Performance: ${name}`,
    level: 'info',
    data: {
      name,
      duration,
      ...details,
      ...deviceInfo,
    },
  });
}