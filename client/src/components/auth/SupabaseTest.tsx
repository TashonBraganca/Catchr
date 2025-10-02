import React, { useState } from 'react';
import { supabase } from '@/config/supabase';

/**
 * SUPABASE CONNECTION TEST COMPONENT
 *
 * This helps diagnose Supabase connection issues
 * Shows exactly what error is happening
 */
export const SupabaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setTestResult('Testing Supabase connection...\n');

    try {
      // Test 1: Check if Supabase client exists
      setTestResult(prev => prev + '\n✓ Supabase client initialized');

      // Test 2: Try to get session (should return null if not logged in)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setTestResult(prev => prev + '\n✗ Session check failed: ' + sessionError.message);
      } else {
        setTestResult(prev => prev + '\n✓ Session check passed (no active session)');
      }

      // Test 3: Try to sign up with REALISTIC test account
      // Supabase rejects timestamp@example.com pattern
      // Use realistic Gmail-like address instead
      const testEmail = `cathcr.test.${Math.floor(Math.random() * 10000)}@gmail.com`;
      const testPassword = 'TestPassword123!';

      setTestResult(prev => prev + `\n\nTrying to sign up with: ${testEmail}`);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError) {
        setTestResult(prev => prev + '\n\n❌ SIGN UP FAILED:');
        setTestResult(prev => prev + '\nError: ' + signUpError.message);
        setTestResult(prev => prev + '\nStatus: ' + signUpError.status);
        setTestResult(prev => prev + '\nCode: ' + (signUpError as any).code);
      } else {
        setTestResult(prev => prev + '\n\n✅ SIGN UP SUCCESS!');
        setTestResult(prev => prev + '\nUser ID: ' + signUpData.user?.id);
        setTestResult(prev => prev + '\nEmail: ' + signUpData.user?.email);

        // Clean up - sign out immediately
        await supabase.auth.signOut();
        setTestResult(prev => prev + '\n(Test user signed out)');
      }

    } catch (err: any) {
      setTestResult(prev => prev + '\n\n❌ UNEXPECTED ERROR:');
      setTestResult(prev => prev + '\n' + err.message);
      setTestResult(prev => prev + '\n' + JSON.stringify(err, null, 2));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 max-w-md shadow-2xl z-50">
      <h3 className="font-bold text-red-600 mb-2">🔧 Supabase Debug</h3>

      <button
        onClick={testConnection}
        disabled={testing}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 mb-2"
      >
        {testing ? 'Testing...' : 'Test Supabase Connection'}
      </button>

      {testResult && (
        <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
          {testResult}
        </pre>
      )}

      <div className="mt-2 text-xs text-gray-600">
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</p>
        <p><strong>Has Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'YES' : 'NO'}</p>
      </div>
    </div>
  );
};

export default SupabaseTest;
