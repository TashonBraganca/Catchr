import React from 'react';
import { SignIn } from '@clerk/clerk-react';

/**
 * AUTH PAGE - Clerk Authentication
 *
 * Uses Clerk's built-in SignIn component which includes:
 * - Google OAuth (automatic)
 * - GitHub OAuth (automatic)
 * - Email/Password authentication
 * - Password reset
 * - Magic link sign-in
 *
 * No manual OAuth configuration needed - Clerk handles everything!
 */
export const AuthPage: React.FC = () => {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Clerk's pre-built sign-in component with custom dark theme styling */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl',
              headerTitle: 'text-white text-2xl font-bold',
              headerSubtitle: 'text-white/60',
              socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
              socialButtonsBlockButtonText: 'text-white font-medium',
              formButtonPrimary: 'bg-orange-500 hover:bg-orange-600 text-white',
              formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-white/40',
              formFieldLabel: 'text-white/80',
              footerActionLink: 'text-orange-500 hover:text-orange-400',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-orange-500',
              formResendCodeLink: 'text-orange-500 hover:text-orange-400',
              otpCodeFieldInput: 'bg-white/10 border-white/20 text-white',
              dividerLine: 'bg-white/10',
              dividerText: 'text-white/60',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
};

export default AuthPage;
