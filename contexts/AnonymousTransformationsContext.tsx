import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

const ANONYMOUS_TRANSFORMS_KEY = 'anonymous_transformations';
const MAX_FREE_TRANSFORMS = 2;

type AnonymousTransformation = {
  originalPhoto: string;
  resultPhoto: string;
  settings: Record<string, any>;
  timestamp: number;
};

type AnonymousTransformationsContextType = {
  transformationsLeft: number;
  transformationsUsed: number;
  canTransform: boolean;
  recordTransformation: (transformation: Omit<AnonymousTransformation, 'timestamp'>) => Promise<void>;
  resetTransformations: () => Promise<void>;
  isResetting: boolean;
};

const AnonymousTransformationsContext = createContext<AnonymousTransformationsContextType | undefined>(undefined);

export function AnonymousTransformationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transformationsUsed, setTransformationsUsed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [transformations, setTransformations] = useState<AnonymousTransformation[]>([]);

  // Load saved transformations on mount
  useEffect(() => {
    loadTransformations();
  }, []);

  // When user signs in, migrate anonymous transformations
  useEffect(() => {
    if (user && transformations.length > 0) {
      migrateTransformations();
    }
  }, [user, transformations]);

  const loadTransformations = async () => {
    try {
      const saved = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AnonymousTransformation[];
        setTransformations(parsed);
        setTransformationsUsed(parsed.length);
      }
    } catch (error) {
      console.error('Error loading transformations:', error);
    }
  };

  const migrateTransformations = async () => {
    if (!user) return;

    try {
      // Insert each transformation into the user's gallery
      for (const transform of transformations) {
        await supabase
          .from('transformations')
          .insert({
            user_id: user.id,
            original_photo: transform.originalPhoto,
            result_photo: transform.resultPhoto,
            ...transform.settings,
          });
      }

      // Clear anonymous transformations after successful migration
      await resetTransformations();
    } catch (error) {
      console.error('Error migrating transformations:', error);
    }
  };

  const recordTransformation = async (transformation: Omit<AnonymousTransformation, 'timestamp'>) => {
    if (transformationsUsed >= MAX_FREE_TRANSFORMS) return;

    const newTransformation = {
      ...transformation,
      timestamp: Date.now(),
    };

    const updatedTransformations = [...transformations, newTransformation];
    
    try {
      await AsyncStorage.setItem(
        ANONYMOUS_TRANSFORMS_KEY,
        JSON.stringify(updatedTransformations)
      );
      setTransformations(updatedTransformations);
      setTransformationsUsed(prev => prev + 1);
    } catch (error) {
      console.error('Error saving transformation:', error);
    }
  };

  const resetTransformations = async () => {
    setIsResetting(true);
    try {
      await AsyncStorage.removeItem(ANONYMOUS_TRANSFORMS_KEY);
      setTransformations([]);
      setTransformationsUsed(0);
    } catch (error) {
      console.error('Error resetting transformations:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AnonymousTransformationsContext.Provider
      value={{
        transformationsLeft: MAX_FREE_TRANSFORMS - transformationsUsed,
        transformationsUsed,
        canTransform: transformationsUsed < MAX_FREE_TRANSFORMS,
        recordTransformation,
        resetTransformations,
        isResetting,
      }}
    >
      {children}
    </AnonymousTransformationsContext.Provider>
  );
}

export function useAnonymousTransformations() {
  const context = useContext(AnonymousTransformationsContext);
  if (context === undefined) {
    throw new Error('useAnonymousTransformations must be used within an AnonymousTransformationsProvider');
  }
  return context;
}