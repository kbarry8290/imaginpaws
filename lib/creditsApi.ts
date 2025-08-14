import { supabase } from './supabase';
import { logCreditsOperation, logCreditsError, logCreditsDebug } from '@/utils/DebugLogger';

// Error types for normalized error handling
export type CreditsError = 'NO_CREDITS' | 'RLS_FORBIDDEN' | 'CONCURRENT_UPDATE' | 'UNKNOWN';

// Public Credits type for components (hides internal table structure)
export interface Credits {
  pictureCredits: number;
  bonusCredits: number;
  dailyScansUsed: number;
  lastScanDate: string;
  lastCreditRefill: string | null;
  lastPurchasedPackName: string | null;
  updatedAt: string;
}

// Internal types for the user_credits table (matches database schema)
export interface UserCredits {
  user_id: string;
  picture_credits: number;
  bonus_credits: number;
  daily_scans_used: number;
  last_scan_date: string;
  last_credit_refill: string | null;
  last_purchased_pack_name: string | null;
  updated_at: string;
}

// Helper function to convert internal type to public type
export function toCredits(userCredits: UserCredits): Credits {
  return {
    pictureCredits: userCredits.picture_credits,
    bonusCredits: userCredits.bonus_credits,
    dailyScansUsed: userCredits.daily_scans_used,
    lastScanDate: userCredits.last_scan_date,
    lastCreditRefill: userCredits.last_credit_refill,
    lastPurchasedPackName: userCredits.last_purchased_pack_name,
    updatedAt: userCredits.updated_at,
  };
}

// Types for API operations
export interface IncrementCreditsParams {
  productId: string;
  amount: number;
}

/**
 * Read current credits for the authenticated user
 */
export async function getCredits(): Promise<UserCredits | null> {
  logCreditsOperation('Starting getCredits');
  
  try {
    // Get current user session to ensure authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logCreditsError('getCredits session error', sessionError);
      throw new Error('RLS_FORBIDDEN');
    }
    
    if (!session) {
      logCreditsError('getCredits no session found');
      throw new Error('RLS_FORBIDDEN');
    }
    
    logCreditsDebug('getCredits user authenticated', { userId: session.user.id });
    
    // Use maybeSingle() instead of single() to handle no rows case
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .maybeSingle();

    if (error) {
      logCreditsError('getCredits database error', error);
      throw error;
    }

    if (!data) {
      // No rows returned - user doesn't have a credits row yet
      logCreditsDebug('No credits row found for user');
      return null;
    }

    logCreditsOperation('Finished getCredits', data);
    return data;
  } catch (error: any) {
    logCreditsError('getCredits error', error);
    throw error;
  }
}

/**
 * Ensure a credits row exists for the user (upsert without user_id)
 * The database trigger will set user_id = auth.uid()
 */
export async function ensureCreditsRow(): Promise<UserCredits> {
  logCreditsOperation('Starting ensureCreditsRow');
  
  try {
    // Get current user session to ensure authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logCreditsError('ensureCreditsRow session error', sessionError);
      throw new Error('RLS_FORBIDDEN');
    }
    
    if (!session) {
      logCreditsError('ensureCreditsRow no session found');
      throw new Error('RLS_FORBIDDEN');
    }
    
    logCreditsDebug('ensureCreditsRow user authenticated', { userId: session.user.id });
    
    // First try to get existing row
    const existingCredits = await getCredits();
    if (existingCredits) {
      logCreditsOperation('Finished ensureCreditsRow (existing row)', existingCredits);
      return existingCredits;
    }
    
    // If no existing row, create one with user_id for RLS compliance
    const { data, error } = await supabase
      .from('user_credits')
      .insert({
        user_id: session.user.id,
        picture_credits: 0,
        bonus_credits: 0,
        daily_scans_used: 0,
      })
      .select()
      .single();

    if (error) {
      logCreditsError('ensureCreditsRow database error', error);
      throw error;
    }

    logCreditsOperation('Finished ensureCreditsRow (new row)', data);
    return data;
  } catch (error: any) {
    logCreditsError('ensureCreditsRow error', error);
    throw error;
  }
}

/**
 * Increment credits and set refill fields (read-modify-write)
 */
export async function incrementCredits({ productId, amount }: IncrementCreditsParams): Promise<UserCredits> {
  logCreditsOperation('Starting incrementCredits', { productId, amount });
  
  try {
    // Get current user session to ensure authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logCreditsError('incrementCredits session error', sessionError);
      throw new Error('RLS_FORBIDDEN');
    }
    
    if (!session) {
      logCreditsError('incrementCredits no session found');
      throw new Error('RLS_FORBIDDEN');
    }
    
    logCreditsDebug('incrementCredits user authenticated', { userId: session.user.id });
    
    // First, ensure we have a row
    let credits = await getCredits();
    if (!credits) {
      credits = await ensureCreditsRow();
    }

    // Log computed new balances before write
    const newPictureCredits = credits.picture_credits + amount;
    logCreditsDebug('Computed new balances before write', {
      currentPictureCredits: credits.picture_credits,
      amount,
      newPictureCredits,
      productId
    });

    // Read-modify-write with optimistic locking
    const { data, error } = await supabase
      .from('user_credits')
      .update({
        picture_credits: newPictureCredits,
        last_credit_refill: new Date().toISOString(),
        last_purchased_pack_name: productId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', credits.user_id)
      .eq('updated_at', credits.updated_at) // Optimistic locking
      .select()
      .single();

    if (error) {
      logCreditsError('incrementCredits database error', error);
      if (error.code === '23514') {
        // Check constraint violation (non-negative credits)
        throw new Error('NO_CREDITS');
      }
      if (error.code === '23505') {
        // Unique constraint violation or concurrent update
        throw new Error('CONCURRENT_UPDATE');
      }
      if (error.code === '42501') {
        // RLS policy violation
        throw new Error('RLS_FORBIDDEN');
      }
      throw error;
    }

    if (!data) {
      // No rows updated - likely concurrent update
      logCreditsError('incrementCredits no rows updated - concurrent update');
      throw new Error('CONCURRENT_UPDATE');
    }

    logCreditsOperation('Finished incrementCredits', data);
    return data;
  } catch (error: any) {
    logCreditsError('incrementCredits error', error);
    
    // Normalize error types
    if (error.message === 'NO_CREDITS' || error.message === 'RLS_FORBIDDEN' || error.message === 'CONCURRENT_UPDATE') {
      throw error;
    }
    
    // Check for PostgREST/RLS errors
    if (error.code === '42501') {
      throw new Error('RLS_FORBIDDEN');
    }
    if (error.code === '23514') {
      throw new Error('NO_CREDITS');
    }
    
    throw new Error('UNKNOWN');
  }
}

/**
 * Spend one credit (picture first, then bonus) and update daily counters
 */
export async function spendOneCredit(): Promise<UserCredits> {
  logCreditsOperation('Starting spendOneCredit');
  
  try {
    // Get current user session to ensure authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logCreditsError('spendOneCredit session error', sessionError);
      throw new Error('RLS_FORBIDDEN');
    }
    
    if (!session) {
      logCreditsError('spendOneCredit no session found');
      throw new Error('RLS_FORBIDDEN');
    }
    
    logCreditsDebug('spendOneCredit user authenticated', { userId: session.user.id });
    
    // First, ensure we have a row
    let credits = await getCredits();
    if (!credits) {
      credits = await ensureCreditsRow();
    }

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = credits.last_scan_date !== today;

    // Determine which credits to spend and new values
    let newPictureCredits = credits.picture_credits;
    let newBonusCredits = credits.bonus_credits;
    let newDailyScansUsed = isNewDay ? 1 : credits.daily_scans_used + 1;

    if (credits.picture_credits > 0) {
      newPictureCredits = credits.picture_credits - 1;
    } else if (credits.bonus_credits > 0) {
      newBonusCredits = credits.bonus_credits - 1;
    } else {
      logCreditsError('spendOneCredit no credits available');
      throw new Error('NO_CREDITS');
    }

    // Log computed new balances before write
    logCreditsDebug('Computed new balances before write', {
      currentPictureCredits: credits.picture_credits,
      currentBonusCredits: credits.bonus_credits,
      currentDailyScansUsed: credits.daily_scans_used,
      newPictureCredits,
      newBonusCredits,
      newDailyScansUsed,
      isNewDay,
      today
    });

    // Read-modify-write with optimistic locking
    const { data, error } = await supabase
      .from('user_credits')
      .update({
        picture_credits: newPictureCredits,
        bonus_credits: newBonusCredits,
        daily_scans_used: newDailyScansUsed,
        last_scan_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', credits.user_id)
      .eq('updated_at', credits.updated_at) // Optimistic locking
      .select()
      .single();

    if (error) {
      logCreditsError('spendOneCredit database error', error);
      if (error.code === '23514') {
        // Check constraint violation (non-negative credits)
        throw new Error('NO_CREDITS');
      }
      if (error.code === '23505') {
        // Unique constraint violation or concurrent update
        throw new Error('CONCURRENT_UPDATE');
      }
      if (error.code === '42501') {
        // RLS policy violation
        throw new Error('RLS_FORBIDDEN');
      }
      throw error;
    }

    if (!data) {
      // No rows updated - likely concurrent update
      logCreditsError('spendOneCredit no rows updated - concurrent update');
      throw new Error('CONCURRENT_UPDATE');
    }

    logCreditsOperation('Finished spendOneCredit', data);
    return data;
  } catch (error: any) {
    logCreditsError('spendOneCredit error', error);
    
    // Normalize error types
    if (error.message === 'NO_CREDITS' || error.message === 'RLS_FORBIDDEN' || error.message === 'CONCURRENT_UPDATE') {
      throw error;
    }
    
    // Check for PostgREST/RLS errors
    if (error.code === '42501') {
      throw new Error('RLS_FORBIDDEN');
    }
    if (error.code === '23514') {
      throw new Error('NO_CREDITS');
    }
    
    throw new Error('UNKNOWN');
  }
}

/**
 * Helper that re-fetches and returns latest credits
 */
export async function refreshCredits(): Promise<UserCredits | null> {
  logCreditsOperation('Starting refreshCredits');
  
  try {
    const result = await getCredits();
    logCreditsOperation('Finished refreshCredits', result);
    return result;
  } catch (error: any) {
    logCreditsError('refreshCredits error', error);
    throw error;
  }
}
