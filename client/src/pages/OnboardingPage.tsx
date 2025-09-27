import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { OnboardingFlow } from '@/components/auth/OnboardingFlow';
import { useAuth } from '@/contexts/AuthContext';
import type { OnboardingPreferences } from '@/components/auth/OnboardingFlow';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOnboardingComplete = async (preferences: OnboardingPreferences) => {
    // Log successful onboarding completion
    console.log('Onboarding completed with preferences:', preferences);
    
    // Navigate to dashboard
    navigate('/dashboard', { 
      replace: true,
      state: { onboardingCompleted: true }
    });
  };

  // If user is not authenticated, redirect to auth
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  return (
    <AppLayout 
      variant="minimal" 
      backgroundIntensity="low"
      showBackground={true}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          className="mx-auto"
        />
      </motion.div>
    </AppLayout>
  );
};

export default OnboardingPage;