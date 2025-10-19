import React from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import './index.css';

/**
 * CATHCR - MAIN APPLICATION ENTRY POINT (Clerk Auth)
 *
 * CRITICAL UPDATE (2025-10-19):
 * - Switched from Supabase Auth to Clerk for authentication
 * - Clerk handles ALL auth (Google, GitHub, Email built-in)
 * - Supabase ONLY used for notes database storage
 *
 * Architecture:
 * main.tsx → ClerkProvider → App → SignedIn/SignedOut → AuthPage OR HomePage
 *
 * User flow:
 * 1. Not logged in (SignedOut) → Shows AuthPage with Clerk sign-in UI
 * 2. Logged in (SignedIn) → Shows HomePage (main app with notes)
 */
function App(): React.ReactElement {
  const { isLoaded } = useUser();

  // Show loading spinner while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/60 font-medium">
            Loading Cathcr...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show AuthPage when user is NOT signed in */}
      <SignedOut>
        <AuthPage />
      </SignedOut>

      {/* Show HomePage when user IS signed in */}
      <SignedIn>
        <HomePage />
      </SignedIn>
    </>
  );
}

export default App;
