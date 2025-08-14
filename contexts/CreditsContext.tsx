import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { getCredits, ensureCreditsRow, spendOneCredit, incrementCredits, toCredits, Credits } from '@/lib/creditsApi';

const FREE_SCANS_PER_DAY = 2;

type CreditsContextType = {
  pictureCredits: number;
  bonusCredits: number;
  dailyScansUsed: number;
  lastScanDate: string | null;
  loading: boolean;
  canScan: boolean;
  isSpending: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  spendOne: () => Promise<boolean>;
  applyPurchase: (productId: string, amount: number) => Promise<boolean>;
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [pictureCredits, setPictureCredits] = useState(0);
  const [bonusCredits, setBonusCredits] = useState(0);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpending, setIsSpending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    // Wait for auth to be fully loaded before attempting database operations
    if (authLoading) {
      console.log('CreditsContext: Auth still loading, skipping credits fetch');
      return;
    }

    if (!user) {
      console.log('CreditsContext: No user found, resetting credits state');
      setPictureCredits(0);
      setBonusCredits(0);
      setDailyScansUsed(0);
      setLastScanDate(null);
      setLoading(false);
      return;
    }

    try {
      // Use the new credits API to get current credits
      const userCredits = await getCredits();
      
      if (userCredits) {
        const credits = toCredits(userCredits);
        console.log('CreditsContext: Fetched credits:', credits);
        setPictureCredits(credits.pictureCredits);
        setBonusCredits(credits.bonusCredits);
        setDailyScansUsed(credits.dailyScansUsed);
        setLastScanDate(credits.lastScanDate);
      } else {
        console.log('CreditsContext: No credits found, creating new row');
        // This should be handled by the auth context, but just in case
        const newUserCredits = await ensureCreditsRow();
        const newCredits = toCredits(newUserCredits);
        setPictureCredits(newCredits.pictureCredits);
        setBonusCredits(newCredits.bonusCredits);
        setDailyScansUsed(newCredits.dailyScansUsed);
        setLastScanDate(newCredits.lastScanDate);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('CreditsContext: Error refreshing credits:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user, authLoading]);

  const canScan = pictureCredits > 0 || bonusCredits > 0 || dailyScansUsed < FREE_SCANS_PER_DAY;

  const spendOne = async () => {
    if (!user || authLoading) {
      console.log('CreditsContext: Cannot spend credit - no user or auth loading');
      return false;
    }
    
    if (!canScan) {
      console.log('CreditsContext: Cannot spend credit - no scans available');
      return false;
    }

    // Prevent multiple simultaneous spend operations
    if (isSpending) {
      console.log('CreditsContext: Already spending credit, ignoring duplicate request');
      return false;
    }

    setIsSpending(true);
    setError(null); // Clear any previous errors
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 5000); // 5 second timeout
    });
    
    try {
      // Use the new credits API to spend one credit with timeout
      const updatedUserCredits = await Promise.race([
        spendOneCredit(),
        timeoutPromise
      ]);
      
      const updatedCredits = toCredits(updatedUserCredits);
      console.log('CreditsContext: Successfully spent credit:', updatedCredits);
      
      // Update local state with the returned data
      setPictureCredits(updatedCredits.pictureCredits);
      setBonusCredits(updatedCredits.bonusCredits);
      setDailyScansUsed(updatedCredits.dailyScansUsed);
      setLastScanDate(updatedCredits.lastScanDate);
      
      // Call refresh to ensure UI is in sync
      await refresh();
      
      return true;
    } catch (error: any) {
      console.error('CreditsContext: Error spending credit:', error);
      
      // Map error to user-friendly message
      if (error.message === 'NO_CREDITS') {
        setError("You're out of credits. Buy more to continue.");
      } else if (error.message === 'RLS_FORBIDDEN') {
        setError("We couldn't update your credits. Please sign in again.");
      } else if (error.message === 'CONCURRENT_UPDATE') {
        setError("We couldn't save that change. Please try again.");
      } else if (error.message === 'TIMEOUT') {
        setError("We couldn't save that change. Please try again.");
      } else {
        setError("We couldn't save that change. Please try again.");
      }
      
      return false;
    } finally {
      setIsSpending(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const applyPurchase = async (productId: string, amount: number) => {
    if (!user || authLoading) {
      console.log('CreditsContext: Cannot apply purchase - no user or auth loading');
      return false;
    }

    try {
      // Use the new credits API to increment credits
      const updatedUserCredits = await incrementCredits({ productId, amount });
      
      const updatedCredits = toCredits(updatedUserCredits);
      console.log('CreditsContext: Successfully applied purchase:', updatedCredits);
      
      // Update local state with the returned data
      setPictureCredits(updatedCredits.pictureCredits);
      setBonusCredits(updatedCredits.bonusCredits);
      setDailyScansUsed(updatedCredits.dailyScansUsed);
      setLastScanDate(updatedCredits.lastScanDate);
      
      // Clear any previous errors
      setError(null);
      
      // Call refresh to ensure UI is in sync
      await refresh();
      
      return true;
    } catch (error: any) {
      console.error('CreditsContext: Error applying purchase:', error);
      
      // Map error to user-friendly message
      if (error.message === 'NO_CREDITS') {
        setError("You're out of credits. Buy more to continue.");
      } else if (error.message === 'RLS_FORBIDDEN') {
        setError("We couldn't update your credits. Please sign in again.");
      } else {
        setError("We couldn't save that change. Please try again.");
      }
      
      return false;
    }
  };



  return (
    <CreditsContext.Provider value={{
      pictureCredits,
      bonusCredits,
      dailyScansUsed,
      lastScanDate,
      loading,
      canScan,
      isSpending,
      error,
      clearError,
      refresh,
      spendOne,
      applyPurchase,
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