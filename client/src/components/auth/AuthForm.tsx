import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Github,
  Chrome,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magic';

interface AuthFormProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: () => void;
  className?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode: initialMode = 'signin',
  onModeChange,
  onSuccess,
  className
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { 
    signIn, 
    signUp, 
    signInWithMagicLink,
    signInWithProvider,
    resetPassword,
    loading,
    error,
    clearError 
  } = useAuth();

  // Handle mode changes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    clearError();
    setSuccess(null);
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      return;
    }

    setLocalLoading(true);
    clearError();
    setSuccess(null);

    try {
      let result;
      
      switch (mode) {
        case 'signin':
          if (!formData.password) return;
          result = await signIn(formData.email, formData.password);
          if (!result.error) {
            setSuccess('Welcome back!');
            onSuccess?.();
          }
          break;

        case 'signup':
          if (!formData.password || !formData.username) return;
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          result = await signUp(formData.email, formData.password, {
            username: formData.username.trim()
          });
          if (!result.error) {
            setSuccess('Check your email to confirm your account!');
          }
          break;

        case 'magic':
          result = await signInWithMagicLink(formData.email, window.location.origin);
          if (!result.error) {
            setSuccess('Check your email for the magic link!');
          }
          break;

        case 'forgot':
          result = await resetPassword(formData.email, window.location.origin);
          if (!result.error) {
            setSuccess('Password reset link sent to your email!');
          }
          break;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle OAuth providers
  const handleOAuthProvider = async (provider: 'google' | 'github') => {
    setLocalLoading(true);
    clearError();

    try {
      await signInWithProvider(provider, window.location.origin);
    } catch (err) {
      console.error('OAuth error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const formTitles = {
    signin: 'Welcome Back',
    signup: 'Create Account',
    magic: 'Magic Link',
    forgot: 'Reset Password'
  };

  const formSubtitles = {
    signin: 'Sign in to continue capturing your thoughts',
    signup: 'Join thousands of users organizing their minds',
    magic: 'We\'ll send you a secure sign-in link',
    forgot: 'Enter your email to reset your password'
  };

  return (
    <motion.div
      className={cn('w-full max-w-md mx-auto', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card variant="strong" className="p-8 space-y-6">
        
        {/* Logo */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <div className="w-16 h-16 glass-strong rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {formTitles[mode]}
          </h1>
          
          <p className="text-white/60 text-sm">
            {formSubtitles[mode]}
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OAuth Buttons */}
        <motion.div variants={itemVariants} className="space-y-3">
          <Button
            variant="glass"
            fullWidth
            leftIcon={<Chrome className="w-4 h-4" />}
            onClick={() => handleOAuthProvider('google')}
            disabled={isLoading}
          >
            Continue with Google
          </Button>
          
          <Button
            variant="glass"
            fullWidth
            leftIcon={<Github className="w-4 h-4" />}
            onClick={() => handleOAuthProvider('github')}
            disabled={isLoading}
          >
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/60">or</span>
            </div>
          </div>
        </motion.div>

        {/* Auth Form */}
        <motion.form 
          variants={itemVariants}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          {/* Username - Only for signup */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  leftIcon={<User className="w-4 h-4" />}
                  disabled={isLoading}
                  required={mode === 'signup'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <Input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isLoading}
            required
          />

          {/* Password - Not for magic link or forgot password */}
          <AnimatePresence>
            {mode !== 'magic' && mode !== 'forgot' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/60 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  disabled={isLoading}
                  required
                />

                {/* Confirm Password - Only for signup */}
                {mode === 'signup' && (
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-white/60 hover:text-white/80 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    disabled={isLoading}
                    required
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="orange"
            fullWidth
            disabled={isLoading}
            leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isLoading ? 'Please wait...' : 
             mode === 'signin' ? 'Sign In' :
             mode === 'signup' ? 'Create Account' :
             mode === 'magic' ? 'Send Magic Link' :
             'Send Reset Link'
            }
          </Button>
        </motion.form>

        {/* Mode Switchers */}
        <motion.div variants={itemVariants} className="space-y-4 text-center">
          
          {/* Forgot Password Link - Only for signin */}
          <AnimatePresence>
            {mode === 'signin' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Magic Link Option */}
          <AnimatePresence>
            {(mode === 'signin' || mode === 'signup') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => handleModeChange('magic')}
                  className="text-sm text-white/60 hover:text-white/80 transition-colors"
                  disabled={isLoading}
                >
                  Or sign in with magic link
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Toggle */}
          <div className="pt-4 border-t border-white/10">
            {mode === 'signin' && (
              <p className="text-sm text-white/60">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-sm text-white/60">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            )}

            {(mode === 'forgot' || mode === 'magic') && (
              <p className="text-sm text-white/60">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </motion.div>

      </Card>
    </motion.div>
  );
};

export default AuthForm;