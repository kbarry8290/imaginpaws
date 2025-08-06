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
  manualMigrate: () => Promise<void>; // Add manual migration trigger
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
    console.log('🔄 [Migration] User changed:', user ? `User ID: ${user.id}` : 'No user');
    
    if (user) {
      console.log('🔄 [Migration] User detected, starting migration process');
      console.log('🔄 [Migration] Current transformations in state:', transformations.length);
      
      const attemptMigration = async () => {
        console.log('🔄 [Migration] Attempting migration...');
        
        // First try to migrate with current state
        if (transformations.length > 0) {
          console.log('🔄 [Migration] Found transformations in state, migrating...');
          await migrateTransformations();
          return;
        }
        
        console.log('🔄 [Migration] No transformations in state, checking AsyncStorage...');
        
        // If no transformations in state, try loading from AsyncStorage directly
        try {
          const saved = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
          console.log('🔄 [Migration] AsyncStorage content:', saved ? 'Found data' : 'No data');
          
          if (saved) {
            const parsed = JSON.parse(saved) as AnonymousTransformation[];
            console.log('🔄 [Migration] Parsed transformations from AsyncStorage:', parsed.length);
            
            if (parsed.length > 0) {
              console.log('🔄 [Migration] Found transformations in AsyncStorage, migrating directly');
              await migrateTransformations();
            } else {
              console.log('🔄 [Migration] No transformations found in AsyncStorage');
            }
          } else {
            console.log('🔄 [Migration] No data found in AsyncStorage');
          }
        } catch (error) {
          console.error('🔄 [Migration] Error checking AsyncStorage for migration:', error);
        }
      };
      
      // Add a small delay to ensure auth state is stable
      console.log('🔄 [Migration] Scheduling first migration attempt in 500ms');
      setTimeout(attemptMigration, 500);
      
      // Also try again after a longer delay as a fallback
      console.log('🔄 [Migration] Scheduling fallback migration attempt in 3000ms');
      setTimeout(attemptMigration, 3000);
    } else {
      console.log('🔄 [Migration] No user, skipping migration');
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
    console.log('🚀 [Migrate] Starting migration function');
    
    if (!user) {
      console.log('🚀 [Migrate] No user, returning early');
      return;
    }

    try {
      console.log('🚀 [Migrate] Starting migration of anonymous transformations for user:', user.id);
      
      // Load transformations directly from AsyncStorage to avoid race conditions
      console.log('🚀 [Migrate] Loading from AsyncStorage...');
      const saved = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      console.log('🚀 [Migrate] AsyncStorage result:', saved ? `Found ${saved.length} characters` : 'No data');
      
      if (!saved) {
        console.log('🚀 [Migrate] No anonymous transformations found to migrate');
        return;
      }

      const transformationsToMigrate = JSON.parse(saved) as AnonymousTransformation[];
      console.log('🚀 [Migrate] Parsed transformations:', transformationsToMigrate.length, 'items');
      console.log('🚀 [Migrate] First transformation:', transformationsToMigrate[0]);

      if (transformationsToMigrate.length === 0) {
        console.log('🚀 [Migrate] No transformations to migrate');
        return;
      }

      // Add a small delay to ensure the user session is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

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
        
        console.log('🚀 [Migrate] Inserting transformation into database...');
        console.log('🚀 [Migrate] Insert payload:', {
          user_id: user.id,
          original_photo: transform.originalPhoto,
          result_photo: transform.resultPhoto,
          style: transform.settings.style || '',
          sex: transform.settings.gender || '',
          personality: transform.settings.personality || '',
          clothing: transform.settings.clothing || '',
          background: transform.settings.background || '',
          age: transform.settings.age || 'adult',
        });
        
        const { data, error } = await supabase
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
            age: transform.settings.age || 'adult', // Default to adult if not specified
          });
        
        if (error) {
          console.error('🚀 [Migrate] Error inserting transformation:', error);
          console.error('🚀 [Migrate] Error details:', error.details);
          console.error('🚀 [Migrate] Error hint:', error.hint);
          
          // Don't throw error immediately, log it and continue with other transformations
          console.error('🚀 [Migrate] Failed to migrate transformation, continuing with others...');
          continue;
        }
        
        console.log('🚀 [Migrate] Successfully inserted transformation:', data);
      }

      console.log('Successfully migrated', transformationsToMigrate.length, 'transformations');
      
      // Clear anonymous transformations after successful migration
      await resetTransformations();
      
      // Verify the transformations were saved by fetching them
      const { data: savedTransformations, error: fetchError } = await supabase
        .from('transformations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error verifying saved transformations:', fetchError);
      } else {
        console.log('Verified saved transformations:', savedTransformations?.length || 0, 'found');
      }
    } catch (error) {
      console.error('Error migrating transformations:', error);
    }
  };

  const recordTransformation = async (transformation: Omit<AnonymousTransformation, 'timestamp'>) => {
    console.log('💾 [Record] Starting to record transformation:', transformation);
    console.log('💾 [Record] Current transformations used:', transformationsUsed);
    console.log('💾 [Record] Max free transforms:', MAX_FREE_TRANSFORMS);
    
    if (transformationsUsed >= MAX_FREE_TRANSFORMS) {
      console.log('💾 [Record] Max transformations reached, skipping');
      return;
    }

    const newTransformation = {
      ...transformation,
      timestamp: Date.now(),
    };

    console.log('💾 [Record] New transformation with timestamp:', newTransformation);

    const updatedTransformations = [...transformations, newTransformation];
    console.log('💾 [Record] Updated transformations array length:', updatedTransformations.length);
    
    try {
      const jsonData = JSON.stringify(updatedTransformations);
      console.log('💾 [Record] Saving to AsyncStorage, data length:', jsonData.length);
      
      await AsyncStorage.setItem(
        ANONYMOUS_TRANSFORMS_KEY,
        jsonData
      );
      
      console.log('💾 [Record] Successfully saved to AsyncStorage');
      
      setTransformations(updatedTransformations);
      setTransformationsUsed(prev => prev + 1);
      
      console.log('💾 [Record] Updated state - transformations:', updatedTransformations.length, 'used:', transformationsUsed + 1);
      
      // Verify the save worked
      const verify = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      console.log('💾 [Record] Verification - AsyncStorage contains:', verify ? 'data' : 'no data');
      
    } catch (error) {
      console.error('💾 [Record] Error saving transformation:', error);
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
        manualMigrate: migrateTransformations,
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