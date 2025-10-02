import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load components for better performance
const AuthPage = React.lazy(() => import('@/pages/AuthPage'));
const HomePage = React.lazy(() => import('@/pages/HomePage'));

/**
 * AUTHENTICATED APP WRAPPER
 *
 * This component handles the authentication flow:
 * 1. Shows loading spinner while checking auth status
 * 2. Shows AuthPage if user not logged in
 * 3. Shows HomePage (main app) if user is authenticated
 *
 * Based on REVAMP.md requirement: "use the supabase sign in thing so that
 * each user gets their own database and signin"
 */
export const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Small delay for smoother transition
      const timer = setTimeout(() => setIsInitialLoad(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Loading state - show Apple-style spinner
  if (loading || isInitialLoad) {
    return (
      <div className="h-screen w-full bg-[#fbfbfd] flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Apple-style loading spinner */}
          <motion.div
            className="w-12 h-12 border-3 border-[#007aff] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <motion.p
            className="text-sm text-[#8e8e93] font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            Loading Cathcr...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <React.Suspense
        fallback={
          <div className="h-screen w-full bg-[#fbfbfd] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        {!user ? (
          <motion.div
            key="auth-page"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-screen w-full"
          >
            <AuthPage />
          </motion.div>
        ) : (
          <motion.div
            key="home-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-screen w-full"
          >
            <HomePage />
          </motion.div>
        )}
      </React.Suspense>
    </AnimatePresence>
  );
};

export default AuthenticatedApp;
