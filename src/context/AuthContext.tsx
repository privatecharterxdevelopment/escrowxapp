import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string | null;
  username: string | null;
  wallet_address: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConnected: boolean;
  walletAddress: string | undefined;
  logout: () => void;
  showAuth: boolean;
  authMode: 'login' | 'register';
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // If user ID changed, disconnect wallet (new user logged in)
      if (session?.user?.id && session.user.id !== previousUserId && isConnected) {
        console.log('[Auth] New user detected, disconnecting wallet');
        disconnect();
      }

      setPreviousUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, [isConnected, disconnect, previousUserId]);

  // Create user object from session only - NO wallet-only auth
  useEffect(() => {
    if (session?.user) {
      // User logged in via email/Google - wallet is optional
      console.log('[Auth] Creating user from session:', session.user.email);
      setUser({
        id: session.user.id,
        email: session.user.email || null,
        username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || null,
        wallet_address: address?.toLowerCase() || '',
      });
      setIsLoading(false);
    } else {
      // No session = no user (wallet-only auth disabled)
      setUser(null);
      setIsLoading(false);
    }
  }, [session?.user?.id, address, isConnected]);

  const logout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    // Disconnect wallet
    disconnect();
    setUser(null);
    setSession(null);
  };

  const openLogin = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
  };

  // Memoize the context value
  const contextValue = useMemo(() => ({
    user,
    session,
    isLoading,
    isConnected,
    walletAddress: address,
    logout,
    showAuth,
    authMode,
    openLogin,
    openRegister,
    closeAuth,
  }), [user, session, isLoading, isConnected, address, showAuth, authMode]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
