import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft,
  Brain,
  Lightbulb,
  Target,
  Heart,
  Briefcase,
  BookOpen,
  Coffee,
  Gamepad2,
  Music,
  Palette,
  Check,
  Sparkles,
  Zap,
  Clock,
  Bell,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete?: (preferences: OnboardingPreferences) => void;
  className?: string;
}

export interface OnboardingPreferences {
  displayName: string;
  categories: string[];
  captureFrequency: 'low' | 'medium' | 'high';
  reminderFrequency: 'none' | 'daily' | 'weekly';
  timezone: string;
  interests: string[];
}

const categoryOptions = [
  { id: 'ideas', label: 'Ideas & Innovation', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
  { id: 'goals', label: 'Goals & Planning', icon: Target, color: 'from-blue-500 to-purple-500' },
  { id: 'personal', label: 'Personal Thoughts', icon: Heart, color: 'from-pink-500 to-red-500' },
  { id: 'work', label: 'Work & Business', icon: Briefcase, color: 'from-green-500 to-teal-500' },
  { id: 'learning', label: 'Learning & Growth', icon: BookOpen, color: 'from-indigo-500 to-blue-500' },
  { id: 'random', label: 'Random Thoughts', icon: Coffee, color: 'from-amber-500 to-yellow-500' },
  { id: 'creative', label: 'Creative Projects', icon: Palette, color: 'from-purple-500 to-pink-500' },
  { id: 'entertainment', label: 'Entertainment', icon: Gamepad2, color: 'from-red-500 to-orange-500' },
  { id: 'music', label: 'Music & Audio', icon: Music, color: 'from-cyan-500 to-blue-500' },
];

const steps = [
  { id: 'welcome', title: 'Welcome to Cathcr', subtitle: 'Let\'s personalize your experience' },
  { id: 'profile', title: 'Your Profile', subtitle: 'Tell us a bit about yourself' },
  { id: 'categories', title: 'Thought Categories', subtitle: 'What types of thoughts do you capture?' },
  { id: 'preferences', title: 'Preferences', subtitle: 'How often do you want to capture thoughts?' },
  { id: 'complete', title: 'All Set!', subtitle: 'You\'re ready to start capturing thoughts' }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  onComplete, 
  className 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    displayName: '',
    categories: [],
    captureFrequency: 'medium',
    reminderFrequency: 'weekly',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    interests: []
  });

  const { user, updateProfile, updateUser } = useAuth();

  // Handle form updates
  const updatePreferences = (updates: Partial<OnboardingPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      // Update user profile
      if (preferences.displayName) {
        await updateUser({ 
          data: { 
            display_name: preferences.displayName,
            onboarding_completed: true 
          } 
        });
      }

      // Update profile in database
      await updateProfile({
        username: preferences.displayName || user?.email?.split('@')[0] || '',
        preferences: {
          categories: preferences.categories,
          captureFrequency: preferences.captureFrequency,
          reminderFrequency: preferences.reminderFrequency,
          timezone: preferences.timezone,
          interests: preferences.interests,
          onboardingCompleted: true
        }
      });

      onComplete?.(preferences);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const currentStepData = steps[currentStep];

  return (
    <motion.div
      className={cn('w-full max-w-2xl mx-auto', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card variant="strong" className="p-8 space-y-8 min-h-[600px]">
        
        {/* Progress Bar */}
        <motion.div 
          className="w-full bg-white/10 rounded-full h-2 overflow-hidden"
          variants={itemVariants}
        >
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            custom={currentStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">
                {currentStepData.title}
              </h2>
              <p className="text-white/70">
                {currentStepData.subtitle}
              </p>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px] flex flex-col justify-center">
              {currentStep === 0 && <WelcomeStep />}
              {currentStep === 1 && (
                <ProfileStep 
                  preferences={preferences}
                  onUpdate={updatePreferences}
                />
              )}
              {currentStep === 2 && (
                <CategoriesStep 
                  preferences={preferences}
                  onUpdate={updatePreferences}
                />
              )}
              {currentStep === 3 && (
                <PreferencesStep 
                  preferences={preferences}
                  onUpdate={updatePreferences}
                />
              )}
              {currentStep === 4 && <CompleteStep preferences={preferences} />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index <= currentStep ? "bg-orange-500" : "bg-white/20"
                )}
              />
            ))}
          </div>

          <Button
            variant={currentStep === steps.length - 1 ? "primary" : "glass"}
            onClick={currentStep === steps.length - 1 ? completeOnboarding : nextStep}
            rightIcon={
              currentStep === steps.length - 1 
                ? <Check className="w-4 h-4" />
                : <ArrowRight className="w-4 h-4" />
            }
            disabled={
              (currentStep === 1 && !preferences.displayName.trim()) ||
              (currentStep === 2 && preferences.categories.length === 0)
            }
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// Step Components
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-8">
    <motion.div
      className="mx-auto w-32 h-32 glass-strong rounded-3xl flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
    >
      <Brain className="w-16 h-16 text-orange-400" />
    </motion.div>
    
    <motion.div
      className="space-y-4 max-w-lg mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <p className="text-lg text-white/80">
        Cathcr helps you capture, organize, and reflect on your thoughts with the power of AI.
      </p>
      <p className="text-white/60">
        Let's get you set up in just a few quick steps.
      </p>
    </motion.div>
  </div>
);

interface ProfileStepProps {
  preferences: OnboardingPreferences;
  onUpdate: (updates: Partial<OnboardingPreferences>) => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ preferences, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center">
      <motion.div
        className="mx-auto w-20 h-20 glass-strong rounded-2xl flex items-center justify-center mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-10 h-10 text-orange-400" />
      </motion.div>
    </div>

    <div className="space-y-4 max-w-md mx-auto">
      <Input
        label="Display Name"
        placeholder="What should we call you?"
        value={preferences.displayName}
        onChange={(e) => onUpdate({ displayName: e.target.value })}
        variant="strong"
      />
      
      <p className="text-sm text-white/60 text-center">
        This is how you'll appear in the app. You can change this anytime.
      </p>
    </div>
  </div>
);

interface CategoriesStepProps {
  preferences: OnboardingPreferences;
  onUpdate: (updates: Partial<OnboardingPreferences>) => void;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({ preferences, onUpdate }) => {
  const toggleCategory = (categoryId: string) => {
    const newCategories = preferences.categories.includes(categoryId)
      ? preferences.categories.filter(id => id !== categoryId)
      : [...preferences.categories, categoryId];
    onUpdate({ categories: newCategories });
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-white/70">
        Select the types of thoughts you'd like to capture. You can add more later.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {categoryOptions.map((category, index) => {
          const isSelected = preferences.categories.includes(category.id);
          const Icon = category.icon;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                isSelected 
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-white/20 glass hover:border-white/30 hover:bg-white/5"
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-orange-500"
                    : "bg-white/10 group-hover:bg-white/15"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    isSelected ? "text-white" : "text-white/70"
                  )} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium transition-colors",
                    isSelected ? "text-white" : "text-white/80"
                  )}>
                    {category.label}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

interface PreferencesStepProps {
  preferences: OnboardingPreferences;
  onUpdate: (updates: Partial<OnboardingPreferences>) => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ preferences, onUpdate }) => (
  <div className="space-y-8">
    {/* Capture Frequency */}
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Capture Frequency</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'low', label: 'Casual', desc: 'A few times per week' },
          { id: 'medium', label: 'Regular', desc: 'A few times per day' },
          { id: 'high', label: 'Frequent', desc: 'Multiple times daily' }
        ].map((option) => (
          <motion.button
            key={option.id}
            onClick={() => onUpdate({ captureFrequency: option.id as any })}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-200 text-center",
              preferences.captureFrequency === option.id
                ? "border-orange-500/50 bg-orange-500/10"
                : "border-white/20 glass hover:border-white/30"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="font-medium text-white">{option.label}</p>
            <p className="text-sm text-white/60">{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>

    {/* Reminder Frequency */}
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Bell className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Reminders</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'none', label: 'None', desc: 'No reminders' },
          { id: 'weekly', label: 'Weekly', desc: 'Once per week' },
          { id: 'daily', label: 'Daily', desc: 'Once per day' }
        ].map((option) => (
          <motion.button
            key={option.id}
            onClick={() => onUpdate({ reminderFrequency: option.id as any })}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-200 text-center",
              preferences.reminderFrequency === option.id
                ? "border-orange-500/50 bg-orange-500/10"
                : "border-white/20 glass hover:border-white/30"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="font-medium text-white">{option.label}</p>
            <p className="text-sm text-white/60">{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  </div>
);

interface CompleteStepProps {
  preferences: OnboardingPreferences;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ preferences }) => (
  <div className="text-center space-y-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="mx-auto w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center"
    >
      <Check className="w-16 h-16 text-white" />
    </motion.div>
    
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">
        Welcome to Cathcr, {preferences.displayName}! 🎉
      </h3>
      <p className="text-white/70 max-w-lg mx-auto">
        Your personalized thought capture experience is ready. Use <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl+Shift+C</kbd> to quickly capture thoughts anywhere.
      </p>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{preferences.categories.length}</p>
          <p className="text-sm text-white/60">Categories</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{preferences.captureFrequency}</p>
          <p className="text-sm text-white/60">Frequency</p>
        </div>
      </div>
    </div>
  </div>
);

export default OnboardingFlow;