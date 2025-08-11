import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

let unsub: (() => void) | null = null;

export function initAuthListeners() {
  if (unsub) return; // avoid double init

  console.log('🔗 [AuthEvents] Initializing auth listeners');

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔗 [AuthEvents] Auth state change:', event, session ? 'session exists' : 'no session');
    
    if (event === "PASSWORD_RECOVERY") {
      console.log('🔗 [AuthEvents] PASSWORD_RECOVERY event detected, routing to reset password');
      // We have a short-lived session for reset
      // Route to your reset UI; do NOT expect token/type from URL
      router.replace("/auth/reset-password");
    }
  });

  unsub = () => sub.subscription.unsubscribe();
  console.log('🔗 [AuthEvents] Auth listeners initialized');
}

export function disposeAuthListeners() {
  if (unsub) {
    console.log('🔗 [AuthEvents] Disposing auth listeners');
    unsub();
    unsub = null;
  }
}
