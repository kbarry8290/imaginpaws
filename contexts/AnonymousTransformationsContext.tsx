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
    if (user) {
      // Always try to migrate when user signs in, even if transformations aren't loaded yet
      migrateTransformations();
    }
  }, [user]);

  const loadTransformations = async () => {
    try {
      console.log('Loading anonymous transformations from AsyncStorage');
      const saved = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AnonymousTransformation[];
        console.log('Loaded', parsed.length, 'anonymous transformations');
        setTransformations(parsed);
        setTransformationsUsed(parsed.length);
      } else {
        console.log('No saved anonymous transformations found');
      }
    } catch (error) {
      console.error('Error loading transformations:', error);
    }
  };

  const migrateTransformations = async () => {
    if (!user) return;

    try {
      console.log('Starting migration of anonymous transformations for user:', user.id);
      
      // Load transformations directly from AsyncStorage to avoid race conditions
      const saved = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      if (!saved) {
        console.log('No anonymous transformations found to migrate');
        return;
      }

      const transformationsToMigrate = JSON.parse(saved) as AnonymousTransformation[];
      console.log('Found', transformationsToMigrate.length, 'transformations to migrate');

      if (transformationsToMigrate.length === 0) {
        console.log('No transformations to migrate');
        return;
      }

      // Insert each transformation into the user's gallery
      for (const transform of transformationsToMigrate) {
        console.log('Migrating transformation:', transform);
        
        // Check if this transformation already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('transformations')
          .select('id')
          .eq('user_id', user.id)
          .eq('original_photo', transform.originalPhoto)
          .eq('result_photo', transform.resultPhoto)
          .limit(1);
        
        if (existing && existing.length > 0) {
          console.log('Transformation already exists, skipping:', existing[0].id);
          continue;
        }
        
        const { error } = await supabase
          .from('transformations')
          .insert({
            user_id: user.id,
            original_photo: transform.originalPhoto,
            result_photo: transform.resultPhoto,
            style: transform.settings.style || '',
            sex: transform.settings.gender || '', // Map gender to sex
            personality: transform.settings.personality || '',
            clothing: transform.settings.clothing || '',
            background: transform.settings.background || '',
            age: transform.settings.age || '',
          });
        
        if (error) {
          console.error('Error inserting transformation:', error);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          throw error;
        }
      }

      console.log('Successfully migrated', transformationsToMigrate.length, 'transformations');
      
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

    console.log('Recording anonymous transformation:', newTransformation);

    const updatedTransformations = [...transformations, newTransformation];
    
    try {
      await AsyncStorage.setItem(
        ANONYMOUS_TRANSFORMS_KEY,
        JSON.stringify(updatedTransformations)
      );
      setTransformations(updatedTransformations);
      setTransformationsUsed(prev => prev + 1);
      console.log('Successfully saved anonymous transformation to AsyncStorage');
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