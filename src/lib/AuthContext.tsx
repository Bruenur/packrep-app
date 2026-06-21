import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Auth from './auth';

type AuthContextValue = {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      const s = await Auth.getSession();
      if (!mounted) return;
      if ((s as any).error) {
        setSession(null);
        setUser(null);
      } else {
        const sess = (s as any).session ?? null;
        setSession(sess);
        setUser(sess?.user ?? null);
      }
      setLoading(false);
    }

    init();

    const sub = Auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        sub.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await Auth.signUp(email, password);
      // caller can inspect res for errors
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await Auth.signIn(email, password);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const res = await Auth.signOut();
      // supabase signOut will fire auth state change and update context
      return res;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export default AuthContext;
