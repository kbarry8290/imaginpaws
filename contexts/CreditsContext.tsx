import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

const FREE_SCANS_PER_DAY = 2;

type CreditsContextType = {
  credits: number;
  dailyScansUsed: number;
  loading: boolean;
  canScan: boolean;
  consumeCredit: () => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  refreshCredits: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCredits = async () => {
    // Wait for auth to be fully loaded before attempting database operations
    if (authLoading) {
      console.log('CreditsContext: Auth still loading, skipping credits fetch');
      return;
    }

    if (!user) {
      console.log('CreditsContext: No user found, resetting credits state');
      setCredits(0);
      setDailyScansUsed(0);
      setLastScanDate(null);
      setLoading(false);
      return;
    }

    try {
      // Check for valid Supabase session to prevent RLS violations
      const { data: { session } } = await supabase.auth.getSession();
      
      // Log authentication state for debugging
      console.log('CreditsContext: Authentication state check:');
      console.log('- user.id from useAuth:', user.id);
      console.log('- user.id type:', typeof user.id);
      console.log('- user.id is valid UUID:', isValidUUID(user.id || ''));
      console.log('- session exists:', !!session);
      console.log('- session.user exists:', !!session?.user);
      console.log('- session.user.id:', session?.user?.id);
      console.log('- session.user.id type:', typeof session?.user?.id);
      console.log('- session.user.id is valid UUID:', isValidUUID(session?.user?.id || ''));
      console.log('- IDs match:', user.id === session?.user?.id);

      if (!session) {
        console.error('CreditsContext: No valid Supabase session found, skipping credits fetch');
        setLoading(false);
        return;
      }

      if (!session.user?.id) {
        console.error('CreditsContext: Session user ID is missing');
        setLoading(false);
        return;
      }

      if (!user.id) {
        console.error('CreditsContext: useAuth user ID is missing');
        setLoading(false);
        return;
      }

      if (!isValidUUID(user.id)) {
        console.error('CreditsContext: useAuth user.id is not a valid UUID:', user.id);
        setLoading(false);
        return;
      }

      if (!isValidUUID(session.user.id)) {
        console.error('CreditsContext: session.user.id is not a valid UUID:', session.user.id);
        setLoading(false);
        return;
      }

      if (user.id !== session.user.id) {
        console.error('CreditsContext: User ID mismatch - useAuth:', user.id, 'vs session:', session.user.id);
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // First try to get existing record with proper user filtering for RLS
      console.log('CreditsContext: Attempting to fetch existing user_credits record for user:', user.id);
      let { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('CreditsContext: Error fetching existing user_credits:', error);
        throw error;
      }

      if (!data) {
        console.log('CreditsContext: No existing user_credits record found, creating new one');
        
        // Log the payload being sent for insert
        const insertPayload = {
          user_id: user.id,
          picture_credits: 0,
          daily_scans_used: 0,
          last_scan_date: today,
        };
        
        console.log('CreditsContext: Insert payload:', JSON.stringify(insertPayload, null, 2));
        console.log('CreditsContext: Payload user_id type:', typeof insertPayload.user_id);
        console.log('CreditsContext: Payload user_id is valid UUID:', isValidUUID(insertPayload.user_id));

        // Create initial credits record with user_id for RLS compliance
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert([insertPayload])
          .select()
          .single();

        if (insertError) {
          console.error('CreditsContext: Insert error:', insertError);
          console.error('CreditsContext: Insert error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw insertError;
        }

        console.log('CreditsContext: Successfully created new user_credits record:', newData);
        data = newData;
      } else {
        console.log('CreditsContext: Found existing user_credits record:', data);
      }

      // Check if we need to reset daily scans
      if (data.last_scan_date !== today) {
        console.log('CreditsContext: Resetting daily scans for new day');
        const { data: updatedData, error: updateError } = await supabase
          .from('user_credits')
          .update({
            daily_scans_used: 0,
            last_scan_date: today,
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('CreditsContext: Error updating daily scans:', updateError);
          throw updateError;
        }
        data = updatedData;
      }

      console.log('CreditsContext: Final credits data:', {
        credits: data.picture_credits || 0,
        dailyScansUsed: data.daily_scans_used || 0,
        lastScanDate: data.last_scan_date
      });

      setCredits(data.picture_credits || 0);
      setDailyScansUsed(data.daily_scans_used || 0);
      setLastScanDate(data.last_scan_date);
    } catch (error) {
      console.error('CreditsContext: Error in refreshCredits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCredits();
  }, [user, authLoading]);

  const canScan = credits > 0 || dailyScansUsed < FREE_SCANS_PER_DAY;

  const consumeCredit = async () => {
    if (!user || authLoading) {
      console.log('CreditsContext: Cannot consume credit - no user or auth loading');
      return false;
    }
    
    if (!canScan) {
      console.log('CreditsContext: Cannot consume credit - no scans available');
      return false;
    }

    try {
      // Check for valid Supabase session before consuming credits
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('CreditsContext: consumeCredit - Authentication check:');
      console.log('- user.id:', user.id);
      console.log('- session.user.id:', session?.user?.id);
      console.log('- IDs match:', user.id === session?.user?.id);

      if (!session) {
        console.error('CreditsContext: No valid Supabase session found, cannot consume credit');
        return false;
      }

      if (user.id !== session.user?.id) {
        console.error('CreditsContext: User ID mismatch in consumeCredit');
        return false;
      }

      if (dailyScansUsed < FREE_SCANS_PER_DAY) {
        console.log('CreditsContext: Using free scan');
        // Use free scan first - ensure user_id filter for RLS
        const { data, error } = await supabase
          .from('user_credits')
          .update({
            daily_scans_used: dailyScansUsed + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('CreditsContext: Error updating daily scans:', error);
          throw error;
        }
        setDailyScansUsed(prev => prev + 1);
      } else if (credits > 0) {
        console.log('CreditsContext: Using paid credit');
        // Use paid credit - ensure user_id filter for RLS
        const { data, error } = await supabase
          .from('user_credits')
          .update({
            picture_credits: credits - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('CreditsContext: Error updating paid credits:', error);
          throw error;
        }
        setCredits(prev => prev - 1);
      }
      return true;
    } catch (error) {
      console.error('CreditsContext: Error consuming credit:', error);
      return false;
    }
  };

  const addCredits = async (amount: number) => {
    if (!user || authLoading) {
      console.log('CreditsContext: Cannot add credits - no user or auth loading');
      return;
    }

    try {
      // Check for valid Supabase session before adding credits
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('CreditsContext: addCredits - Authentication check:');
      console.log('- user.id:', user.id);
      console.log('- session.user.id:', session?.user?.id);
      console.log('- IDs match:', user.id === session?.user?.id);

      if (!session) {
        console.error('CreditsContext: No valid Supabase session found, cannot add credits');
        return;
      }

      if (user.id !== session.user?.id) {
        console.error('CreditsContext: User ID mismatch in addCredits');
        return;
      }

      // Ensure user_id filter for RLS compliance
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          picture_credits: credits + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('CreditsContext: Error adding credits:', error);
        throw error;
      }
      
      console.log('CreditsContext: Successfully added credits:', amount);
      setCredits(prev => prev + amount);
    } catch (error) {
      console.error('CreditsContext: Error adding credits:', error);
      throw error;
    }
  };

  return (
    <CreditsContext.Provider value={{
      credits,
      dailyScansUsed,
      loading,
      canScan,
      consumeCredit,
      addCredits,
      refreshCredits,
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}