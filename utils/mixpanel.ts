import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';

// Web SDK import
let mixpanelWeb: any = null;
if (Platform.OS === 'web') {
  try {
    mixpanelWeb = require('mixpanel-browser');
    // Validate that the SDK is properly loaded
    if (!mixpanelWeb || typeof mixpanelWeb.init !== 'function') {
      console.warn('Mixpanel web SDK not properly loaded');
      mixpanelWeb = null;
    }
  } catch (error) {
    console.warn('Failed to load Mixpanel web SDK:', error);
    mixpanelWeb = null;
  }
}

let mixpanel: Mixpanel | null = null;

const MIXPANEL_TOKEN = '43d70383b99e76a948dab1182ecc4b08';

export const initMixpanel = async () => {
  try {
    console.log('🔍 [Mixpanel] Initializing for platform:', Platform.OS);
    
    // Web platform
    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.init(MIXPANEL_TOKEN, {
          debug: __DEV__,
          track_pageview: true,
          persistence: 'localStorage'
        });
        console.log('✅ [Mixpanel] Web initialized successfully');
      } else {
        console.log('❌ [Mixpanel] Web SDK not available');
      }
      return;
    }

    // Native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      mixpanel = await Mixpanel.init(MIXPANEL_TOKEN, true);
      
      // Enable logging in development
      if (__DEV__) {
        mixpanel.setLoggingEnabled(true);
      }
      
      console.log('✅ [Mixpanel] Native initialized successfully');
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to initialize:', error);
  }
};

export const trackEvent = (eventName: string, props?: Record<string, any>) => {
  try {
    // Add common properties to all events
    const eventProps = {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      ...props,
    };

    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.track(eventName, eventProps);
        console.log('✅ [Mixpanel] Web event tracked:', eventName);
      } else {
        console.log('❌ [Mixpanel] Web event not tracked (SDK not available):', eventName);
      }
    } else if (mixpanel) {
      mixpanel.track(eventName, eventProps);
      console.log('✅ [Mixpanel] Native event tracked:', eventName);
    } else {
      console.log('❌ [Mixpanel] Event not tracked (SDK not available):', eventName);
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to track event:', eventName, error);
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.identify(userId);
        if (userProperties) {
          mixpanelWeb.people.set(userProperties);
        }
        console.log('✅ [Mixpanel] Web user identified:', userId);
      } else {
        console.log('❌ [Mixpanel] Web user identification (not tracked):', userId);
      }
    } else if (mixpanel) {
      mixpanel.identify(userId);
      
      if (userProperties) {
        const people = mixpanel.getPeople();
        people.set(userProperties);
      }
      
      console.log('✅ [Mixpanel] Native user identified:', userId);
    } else {
      console.log('❌ [Mixpanel] User identification (not tracked):', userId);
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to identify user:', error);
  }
};

export const resetUser = () => {
  try {
    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.reset();
        console.log('✅ [Mixpanel] Web user reset');
      } else {
        console.log('❌ [Mixpanel] Web user reset (not tracked)');
      }
    } else if (mixpanel) {
      mixpanel.reset();
      console.log('✅ [Mixpanel] Native user reset');
    } else {
      console.log('❌ [Mixpanel] User reset (not tracked)');
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to reset user:', error);
  }
};

// Predefined event tracking functions for common app events
export const trackAuthEvent = (event: 'login' | 'signup' | 'logout', method?: string, userId?: string) => {
  trackEvent(`User ${event.charAt(0).toUpperCase() + event.slice(1)}`, {
    method,
    userId,
  });
};

export const trackTransformEvent = (event: 'started' | 'completed' | 'failed', type: 'pet-to-person' | 'portrait', settings?: Record<string, any>) => {
  trackEvent(`Transformation ${event.charAt(0).toUpperCase() + event.slice(1)}`, {
    type,
    ...settings,
  });
};

export const trackPurchaseEvent = (event: 'started' | 'completed' | 'failed', productId: string, revenue?: number) => {
  trackEvent(`Purchase ${event.charAt(0).toUpperCase() + event.slice(1)}`, {
    productId,
    revenue,
  });
};

export const trackScreenView = (screenName: string) => {
  trackEvent('Screen Viewed', {
    screen: screenName,
  });
};

export const trackUserInteraction = (action: string, element: string, details?: Record<string, any>) => {
  trackEvent('User Interaction', {
    action,
    element,
    ...details,
  });
};

// Timing event functions
export const startTimingEvent = (eventName: string) => {
  try {
    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.timeEvent(eventName);
        console.log('Mixpanel web timing started:', eventName);
      } else {
        console.log('Mixpanel web timing (not tracked):', eventName);
      }
    } else if (mixpanel) {
      mixpanel.timeEvent(eventName);
      console.log('Mixpanel native timing started:', eventName);
    } else {
      console.log('Mixpanel timing (not tracked):', eventName);
    }
  } catch (error) {
    console.error('Failed to start Mixpanel timing event:', error);
  }
};

export const trackTimingEvent = (eventName: string, additionalProps?: Record<string, any>) => {
  try {
    const eventProps = {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      ...additionalProps,
    };

    if (Platform.OS === 'web') {
      if (mixpanelWeb) {
        mixpanelWeb.track(eventName, eventProps);
        console.log('✅ [Mixpanel] Web timing event tracked:', eventName);
      } else {
        console.log('❌ [Mixpanel] Web timing event (not tracked):', eventName);
      }
    } else if (mixpanel) {
      mixpanel.track(eventName, eventProps);
      console.log('✅ [Mixpanel] Native timing event tracked:', eventName);
    } else {
      console.log('❌ [Mixpanel] Timing event (not tracked):', eventName);
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to track timing event:', error);
  }
};

// Convenience functions for specific timing events
export const startPhotoUploadTiming = () => {
  startTimingEvent('Photo Upload');
};

export const trackPhotoUploadTiming = (uploadType: 'camera' | 'gallery', success: boolean, errorMessage?: string) => {
  trackTimingEvent('Photo Upload', {
    uploadType,
    success,
    errorMessage,
  });
};

export const startTransformationTiming = (type: 'pet-to-person' | 'portrait') => {
  startTimingEvent(`Transformation ${type}`);
};

export const trackTransformationTiming = (type: 'pet-to-person' | 'portrait', success: boolean, settings?: Record<string, any>, errorMessage?: string) => {
  trackTimingEvent(`Transformation ${type}`, {
    type,
    success,
    settings,
    errorMessage,
  });
}; 