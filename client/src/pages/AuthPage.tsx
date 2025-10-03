import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AppLayout';
import { AuthForm } from '@/components/auth/AuthForm';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magic';

/**
 * AUTH PAGE - Production Ready
 *
 * Clean authentication page with no dependencies on React Router.
 * AuthenticatedApp handles routing - when user successfully authenticates,
 * AuthContext updates and AuthenticatedApp automatically shows HomePage.
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
    </AuthLayout>
  );
};

export default AuthPage;
