import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';

// Web SDK import - disabled for now due to compatibility issues
let mixpanelWeb: any = null;

const loadMixpanelWeb = () => {
  if (Platform.OS === 'web') {
    console.log('🔍 [Mixpanel] Web SDK disabled - using console logging only');
    // For now, we'll just log events to console on web
    // TODO: Implement proper web tracking when SDK compatibility is resolved
  }
};

let mixpanel: any = null;
let isInitialized = false;
let isInitializing = false;
let eventQueue: Array<{ eventName: string; props?: Record<string, any> }> = [];

const MIXPANEL_TOKEN = '43d70383b99e76a948dab1182ecc4b08';

export const initMixpanel = async () => {
  try {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      console.log('🔍 [Mixpanel] Already initializing, waiting...');
      return;
    }
    
    if (isInitialized) {
      console.log('🔍 [Mixpanel] Already initialized');
      return;
    }
    
    isInitializing = true;
    console.log('🔍 [Mixpanel] Initializing for platform:', Platform.OS);
    
    // Web platform
    if (Platform.OS === 'web') {
      // Load the web SDK first
      loadMixpanelWeb();
      
      // For now, just mark as initialized and log to console
      console.log('✅ [Mixpanel] Web initialized (console logging only)');
      isInitialized = true;
      
      // Process any queued events
      processEventQueue();
      isInitializing = false;
      return;
    }

    // Native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);
      await mixpanel.init();
      
      // Enable logging in development
      if (__DEV__) {
        mixpanel.setLoggingEnabled(true);
      }
      
      console.log('✅ [Mixpanel] Native initialized successfully');
      isInitialized = true;
      
      // Process any queued events
      processEventQueue();
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to initialize:', error);
    isInitialized = false;
  } finally {
    isInitializing = false;
  }
};

const processEventQueue = () => {
  if (!isInitialized) {
    console.log('🔍 [Mixpanel] Not initialized, skipping queue processing');
    return;
  }
  
  console.log(`🔍 [Mixpanel] Processing ${eventQueue.length} queued events`);
  
  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue.shift();
    if (queuedEvent) {
      trackEventInternal(queuedEvent.eventName, queuedEvent.props);
    }
  }
};

const trackEventInternal = (eventName: string, props?: Record<string, any>) => {
  try {
    // Add common properties to all events
    const eventProps = {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      ...props,
    };

    if (Platform.OS === 'web') {
      // For web, just log to console for now
      console.log('📊 [Mixpanel Web] Event:', eventName, eventProps);
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

export const trackEvent = (eventName: string, props?: Record<string, any>) => {
  try {
    // If not initialized and not initializing, queue the event
    if (!isInitialized && !isInitializing) {
      console.log('🔍 [Mixpanel] Not initialized, queuing event:', eventName);
      eventQueue.push({ eventName, props });
      return;
    }
    
    // If still initializing, queue the event
    if (isInitializing) {
      console.log('🔍 [Mixpanel] Still initializing, queuing event:', eventName);
      eventQueue.push({ eventName, props });
      return;
    }
    
    // If initialized, track immediately
    if (isInitialized) {
      trackEventInternal(eventName, props);
    } else {
      // Fallback: queue the event
      console.log('🔍 [Mixpanel] Fallback: queuing event:', eventName);
      eventQueue.push({ eventName, props });
    }
  } catch (error) {
    console.error('❌ [Mixpanel] Failed to track event:', eventName, error);
  }
};

// Add a function to ensure Mixpanel is initialized before tracking
export const ensureMixpanelInitialized = async () => {
  if (!isInitialized && !isInitializing) {
    console.log('🔍 [Mixpanel] Ensuring initialization before tracking');
    await initMixpanel();
  } else if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    // If not initialized, skip user identification
    if (!isInitialized) {
      console.log('🔍 [Mixpanel] Not initialized, skipping user identification:', userId);
      return;
    }
    
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
    // If not initialized, skip user reset
    if (!isInitialized) {
      console.log('🔍 [Mixpanel] Not initialized, skipping user reset');
      return;
    }
    
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
    // If not initialized, skip timing
    if (!isInitialized) {
      console.log('🔍 [Mixpanel] Not initialized, skipping timing start:', eventName);
      return;
    }
    
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
    // Use the same queuing logic as trackEvent
    if (!isInitialized && !isInitializing) {
      console.log('🔍 [Mixpanel] Not initialized, queuing timing event:', eventName);
      eventQueue.push({ eventName, props: additionalProps });
      return;
    }
    
    if (isInitializing) {
      console.log('🔍 [Mixpanel] Still initializing, queuing timing event:', eventName);
      eventQueue.push({ eventName, props: additionalProps });
      return;
    }
    
    if (isInitialized) {
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
    } else {
      console.log('🔍 [Mixpanel] Fallback: queuing timing event:', eventName);
      eventQueue.push({ eventName, props: additionalProps });
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