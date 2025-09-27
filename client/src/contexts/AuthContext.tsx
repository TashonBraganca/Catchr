import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, auth } from '@/config/supabase';

// Types
interface Profile {
  id: string;
  username: string | null;
  preferences: any | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | null;
}

interface AuthContextType extends AuthState {
  // Authentication methods
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithProvider: (provider: 'google' | 'github' | 'discord', redirectTo?: string) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ data: any; error: AuthError | null }>;
  updateUser: (updates: { email?: string; password?: string; data?: Record<string, any> }) => Promise<{ data: any; error: AuthError | null }>;
  
  // Profile methods
  updateProfile: (updates: { username?: string; preferences?: any }) => Promise<Profile | null>;
  
  // Utility methods
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  
  // Legacy compatibility for existing code
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          setState(prev => ({ ...prev, error, loading: false }));
          return;
        }

        // If we have a session, fetch the profile
        let profile = null;
        if (session?.user) {
          profile = await fetchProfile(session.user.id);
        }

        setState({
          user: session?.user || null,
          session: session,
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error as AuthError,
            loading: false,
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);

        // Handle different auth events
        let profile = null;
        if (session?.user && event !== 'SIGNED_OUT') {
          profile = await fetchProfile(session.user.id);
        }

        setState({
          user: session?.user || null,
          session: session,
          profile,
          loading: false,
          error: null,
        });

        // Handle post-auth actions
        if (event === 'SIGNED_IN' && session?.user) {
          // Create or update profile on sign in
          await createOrUpdateProfile(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Helper function to create or update profile
  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || null,
          preferences: user.user_metadata?.preferences || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating profile:', error);
      } else {
        setState(prev => ({ ...prev, profile: data }));
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    }
  };

  // Authentication methods
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.signUp(email, password, metadata);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, loading: false }));
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.signIn(email, password);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, loading: false }));
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.signInWithMagicLink(email, redirectTo);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord', redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.signInWithProvider(provider, redirectTo);
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.signOut();
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { error: authError };
    }
  };

  const resetPassword = async (email: string, redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.resetPassword(email, redirectTo);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  const updateUser = async (updates: { email?: string; password?: string; data?: Record<string, any> }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await auth.updateUser(updates);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: null, error: authError };
    }
  };

  // Profile methods
  const updateProfile = async (updates: { username?: string; preferences?: any }): Promise<Profile | null> => {
    if (!state.user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        setState(prev => ({ ...prev, error: error as AuthError }));
        return null;
      }

      setState(prev => ({ ...prev, profile: data }));
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      setState(prev => ({ ...prev, error: error as AuthError }));
      return null;
    }
  };

  // Utility methods
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const refreshProfile = async () => {
    if (!state.user) return;

    try {
      const profile = await fetchProfile(state.user.id);
      setState(prev => ({ ...prev, profile }));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Legacy compatibility methods
  const login = async (email: string, password: string): Promise<void> => {
    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    const result = await signUp(email, password, { username });
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const logout = (): void => {
    signOut();
  };

  const contextValue: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithProvider,
    signOut,
    resetPassword,
    updateUser,
    updateProfile,
    clearError,
    refreshProfile,
    // Legacy compatibility
    isAuthenticated: !!state.user,
    isLoading: state.loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = null, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>;
  }

  if (requireAuth && !user) {
    return <>{fallback}</>;
  }

  if (!requireAuth && user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Custom hooks for specific auth states
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useProfile = () => {
  const { profile } = useAuth();
  return profile;
};

export const useAuthLoading = () => {
  const { loading } = useAuth();
  return loading;
};

export const useAuthError = () => {
  const { error, clearError } = useAuth();
  return { error, clearError };
};

// Type exports
export type { Profile, AuthState, AuthContextType };