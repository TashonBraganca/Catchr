import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthLayout } from '@/components/layout/AppLayout';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magic';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  // Get initial mode from URL params
  const modeParam = searchParams.get('mode') as AuthMode;
  const [mode, setMode] = useState<AuthMode>(
    modeParam && ['signin', 'signup', 'forgot', 'magic'].includes(modeParam) 
      ? modeParam 
      : 'signin'
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Update URL when mode changes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('mode', newMode);
      return params;
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    // Navigation will be handled by the useEffect above
    // when the user state updates
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <AuthLayout className="flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading...</p>
        </motion.div>
      </AuthLayout>
    );
  }

  // Don't render if user is authenticated
  if (user) {
    return null;
  }

  return (
    <AuthLayout 
      title="Cathcr"
      subtitle="AI-powered thought capture and organization"
    >
      <AuthForm
        mode={mode}
        onModeChange={handleModeChange}
        onSuccess={handleAuthSuccess}
      />
    </AuthLayout>
  );
};

export default AuthPage;