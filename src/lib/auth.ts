import { supabase } from './supabase';

// Lightweight auth helpers used by the AuthContext and later UI wiring.
// These wrap the Supabase client and keep the rest of the app decoupled.

export async function signUp(email: string, password: string) {
  try {
    const result = await supabase.auth.signUp({ email, password });
    return result;
  } catch (err) {
    return { error: err };
  }
}

export async function signIn(email: string, password: string) {
  try {
    // signInWithPassword is used by supabase-js v2; if your project uses v1 adjust accordingly.
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  } catch (err) {
    return { error: err };
  }
}

export async function signOut() {
  try {
    const result = await supabase.auth.signOut();
    return result;
  } catch (err) {
    return { error: err };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { error };
    return { session: data?.session ?? null };
  } catch (err) {
    return { error: err };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { error };
    return { user: data?.user ?? null };
  } catch (err) {
    return { error: err };
  }
}

export function onAuthStateChange(callback: (event: string, session: any | null) => void) {
  // Returns a subscription object with an `unsubscribe()` method.
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    try {
      callback(event, session?.session ?? null);
    } catch (e) {
      // swallow callback errors to avoid crashing the listener
      // eslint-disable-next-line no-console
      console.error('onAuthStateChange callback error', e);
    }
  });

  return data?.subscription ?? { unsubscribe: () => {} };
}

export default {
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  onAuthStateChange,
};
