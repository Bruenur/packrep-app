import supabase from './supabase';

/*
 * Lightweight API wrappers for Supabase operations used during Phase 1.
 * These helpers are intentionally small and are NOT wired into screens yet.
 */

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  // signInWithPassword is the newer v2 API; fall back to common pattern.
  // Consumers should handle returned data/error.
  // @ts-ignore
  if (typeof supabase.auth.signInWithPassword === 'function') {
    // @ts-ignore
    return supabase.auth.signInWithPassword({ email, password });
  }
  // @ts-ignore
  return supabase.auth.signIn({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  // v2: getUser(); v1: user()
  // @ts-ignore
  if (typeof supabase.auth.getUser === 'function') {
    // @ts-ignore
    const res = await supabase.auth.getUser();
    // @ts-ignore
    return res.data?.user ?? null;
  }
  // @ts-ignore
  return supabase.auth.user ? supabase.auth.user() : null;
}

export async function upsertUserProfile(profile: { id?: string; email?: string; profile?: any }) {
  const { id, email, profile: payload } = profile;
  const row = { id, email, profile: payload };
  return supabase.from('users').upsert(row).select().maybeSingle();
}

export async function getLeadsByUser(ownerId: string) {
  return supabase.from('leads').select('*').eq('owner_id', ownerId);
}

export async function createLead(ownerId: string, title: string, payload: any) {
  const row = { owner_id: ownerId, title, payload };
  return supabase.from('leads').insert(row).select().maybeSingle();
}

export async function updateLead(id: string, changes: Partial<{ title: string; payload: any }>) {
  return supabase.from('leads').update(changes).eq('id', id).select().maybeSingle();
}

export async function deleteLead(id: string) {
  return supabase.from('leads').delete().eq('id', id);
}
