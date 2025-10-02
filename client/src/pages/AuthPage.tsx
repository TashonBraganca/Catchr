import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AppLayout';
import { AuthForm } from '@/components/auth/AuthForm';
import { SupabaseTest } from '@/components/auth/SupabaseTest';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magic';

/**
 * AUTH PAGE - SIMPLIFIED (No React Router)
 *
 * CRITICAL FIX: Removed all react-router-dom dependencies
 * - No useNavigate() - was causing crashes
 * - No useSearchParams() - not needed
 * - No navigate('/dashboard') - AuthenticatedApp handles routing
 *
 * User will stay on this page until logged in, then AuthenticatedApp
 * will automatically switch to HomePage
 */
export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');

  // Handle mode changes (signin/signup/forgot/magic)
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
  };

  // Handle successful authentication
  // No need to navigate - AuthenticatedApp will automatically
  // detect user state change and show HomePage
  const handleAuthSuccess = () => {
    console.log('✅ Authentication successful');
    // AuthContext will update user state
    // AuthenticatedApp will detect it and show HomePage
  };

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

      {/* Debug tool - shows exact Supabase errors */}
      <SupabaseTest />
    </AuthLayout>
  );
};

export default AuthPage;
