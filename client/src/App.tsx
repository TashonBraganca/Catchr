import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticatedApp from './components/auth/AuthenticatedApp';
import './styles/globals.css';

/**
 * CATHCR - MAIN APPLICATION ENTRY POINT
 *
 * CRITICAL FIX (2025-10-02):
 * - Wrapped entire app with AuthProvider for Supabase authentication
 * - Added AuthenticatedApp component to handle login/signup flow
 * - Fixes user report: "there is no option to sign in, fix that"
 *
 * Architecture:
 * App.tsx → AuthProvider → AuthenticatedApp → AuthPage OR HomePage
 *
 * User flow:
 * 1. Not logged in → Shows AuthPage (sign up/login)
 * 2. Logged in → Shows HomePage (main app with notes)
 */
function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
