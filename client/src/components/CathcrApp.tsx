import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Contexts
import { AuthProvider, useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { CaptureProvider } from '@/contexts/CaptureContext';

// Layouts
import { AppLayout, DashboardLayout } from '@/components/layout/AppLayout';
import { Navigation } from '@/components/layout/Navigation';

// Pages
import AuthPage from '@/pages/AuthPage';
import OnboardingPage from '@/pages/OnboardingPage';

// Components
import CaptureModal from '@/components/capture/CaptureModal';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { useCapture } from '@/contexts/CaptureContext';

// Temporary dashboard component
const DashboardPage: React.FC = () => {
  const { openCapture } = useCapture();
  
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold text-white">Welcome to Cathcr</h1>
            <p className="text-white/70">Your AI-powered thought capture companion</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="glass-card p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
              <div className="space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Global capture shortcut:</span>
                  <kbd className="kbd">Ctrl+Shift+C</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Toggle recording:</span>
                  <kbd className="kbd">Space</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quick save:</span>
                  <kbd className="kbd">Ctrl+Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Close modal:</span>
                  <kbd className="kbd">Escape</kbd>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={() => openCapture('voice')}
                className="glass-button px-6 py-3 rounded-lg text-white font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎤 Voice Capture
              </motion.button>
              
              <motion.button
                onClick={() => openCapture('text')}
                className="glass-button px-6 py-3 rounded-lg text-white font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✏️ Text Capture
              </motion.button>
              
              <motion.button
                onClick={() => openCapture('mixed')}
                className="glass-button px-6 py-3 rounded-lg text-white font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎯 Mixed Mode
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Component that handles global shortcuts and capture modal
const CaptureHandler: React.FC = () => {
  const { openCapture } = useCapture();
  
  // Enable global shortcuts
  useGlobalShortcuts({
    enableCapture: true,
    enableInInputs: false,
    preventDefault: true,
  });

  return <CaptureModal />;
};

// App content with authentication
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLayout variant="minimal" className="flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading Cathcr...</p>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <CaptureProvider>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/auth" 
          element={
            <ProtectedRoute requireAuth={false} fallback={<Navigate to="/dashboard" replace />}>
              <AuthPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
              <OnboardingPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
              <AppLayout variant="default" isAuthenticated={!!user}>
                <Navigation 
                  isAuthenticated={!!user} 
                  onCaptureClick={() => {
                    // This will be handled by global shortcuts, but we can also trigger from nav
                    const event = new KeyboardEvent('keydown', {
                      key: 'c',
                      ctrlKey: true,
                      shiftKey: true,
                      bubbles: true
                    });
                    document.dispatchEvent(event);
                  }}
                />
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default route */}
        <Route 
          path="*" 
          element={
            <Navigate to={user ? "/dashboard" : "/auth"} replace />
          } 
        />
      </Routes>
      
      {/* Global capture modal and shortcuts (only when authenticated) */}
      {user && <CaptureHandler />}
    </CaptureProvider>
  );
};

// Main app component
export const CathcrApp: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white font-primary">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default CathcrApp;