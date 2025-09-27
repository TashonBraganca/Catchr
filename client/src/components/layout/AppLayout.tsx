import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import { SynthWaveBackground, RecordingBackground, AmbientBackground } from '@/components/background/SynthWaveBackground';
import { Navigation, CompactNavigation } from '@/components/layout/Navigation';
import { ScrollFadeWrapper } from '@/components/animations/ScrollFadeWrapper';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  backgroundIntensity?: 'low' | 'medium' | 'high';
  isRecording?: boolean;
  onCaptureClick?: () => void;
  onSearchClick?: () => void;
  isAuthenticated?: boolean;
  title?: string;
  showBackground?: boolean;
}

// Loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <motion.div
        className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full mx-auto mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-white/60 font-primary">Loading Cathcr...</p>
    </div>
  </div>
);

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  variant = 'default',
  backgroundIntensity = 'medium',
  isRecording = false,
  onCaptureClick,
  onSearchClick,
  isAuthenticated = false,
  title,
  showBackground = true
}) => {
  // Layout variants
  const layoutVariants = {
    default: 'min-h-screen bg-black font-primary antialiased relative overflow-x-hidden',
    compact: 'min-h-screen bg-black font-primary antialiased relative overflow-x-hidden',
    minimal: 'min-h-screen bg-black font-primary antialiased relative'
  };

  const containerVariants = {
    default: 'relative z-10 pt-16',
    compact: 'relative z-10 pt-14', 
    minimal: 'relative z-10'
  };

  return (
    <div className={cn(layoutVariants[variant], className)}>
      
      {/* Background Layers */}
      {showBackground && (
        <div className="fixed inset-0 z-0">
          <SynthWaveBackground 
            intensity={backgroundIntensity}
            speed="medium"
          />
          
          <AnimatePresence>
            {isRecording && <RecordingBackground isRecording={isRecording} />}
          </AnimatePresence>
          
          {!isRecording && backgroundIntensity === 'low' && <AmbientBackground />}
        </div>
      )}

      {/* Navigation */}
      {variant === 'default' && (
        <Navigation
          isAuthenticated={isAuthenticated}
          onCaptureClick={onCaptureClick}
          onSearchClick={onSearchClick}
        />
      )}
      
      {variant === 'compact' && (
        <CompactNavigation
          onCaptureClick={onCaptureClick}
          title={title}
        />
      )}

      {/* Main Content */}
      <main className={cn(containerVariants[variant])}>
        <Suspense fallback={<LoadingSkeleton />}>
          <ScrollFadeWrapper
            threshold={0.1}
            duration={0.8}
            className="relative"
          >
            {children}
          </ScrollFadeWrapper>
        </Suspense>
      </main>

      {/* Glass overlay for better readability when needed */}
      <div className="fixed inset-0 bg-black/10 pointer-events-none z-[1]" />
      
    </div>
  );
};

// Specialized layout for dashboard pages
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  sidebarWidth?: 'sm' | 'md' | 'lg';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  className,
  sidebarWidth = 'md'
}) => {
  const sidebarWidths = {
    sm: 'w-64',
    md: 'w-72',
    lg: 'w-80'
  };

  return (
    <AppLayout variant="default" className={className}>
      <div className="flex min-h-screen">
        
        {/* Sidebar */}
        {sidebar && (
          <motion.aside
            className={cn(
              'fixed left-0 top-16 bottom-0 z-30',
              'glass-strong border-r border-white/10',
              'hidden lg:block',
              sidebarWidths[sidebarWidth]
            )}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="h-full overflow-y-auto p-6">
              {sidebar}
            </div>
          </motion.aside>
        )}

        {/* Main Content Area */}
        <div className={cn(
          'flex-1 flex flex-col',
          sidebar && 'lg:ml-72'
        )}>
          
          {/* Header */}
          {header && (
            <motion.header
              className="glass-strong border-b border-white/10 p-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {header}
            </motion.header>
          )}

          {/* Page Content */}
          <div className="flex-1 relative">
            <ScrollFadeWrapper threshold={0.1} className="h-full">
              {children}
            </ScrollFadeWrapper>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Specialized layout for auth pages
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className
}) => {
  return (
    <AppLayout variant="minimal" backgroundIntensity="low" className={className}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <ScrollFadeWrapper 
          threshold={0.1}
          className="w-full max-w-md"
          direction="up"
          distance={40}
          duration={0.8}
        >
          <div className="glass-card p-8 space-y-6">
            
            {/* Logo */}
            <motion.div 
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-16 h-16 glass-strong rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-orange-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                {title || 'Cathcr'}
              </h1>
              
              {subtitle && (
                <p className="text-white/60 text-sm">
                  {subtitle}
                </p>
              )}
            </motion.div>

            {/* Auth Form */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </ScrollFadeWrapper>
      </div>
    </AppLayout>
  );
};

// Specialized layout for capture modal
interface CaptureLayoutProps {
  children: React.ReactNode;
  isRecording?: boolean;
  className?: string;
}

export const CaptureLayout: React.FC<CaptureLayoutProps> = ({
  children,
  isRecording = false,
  className
}) => {
  return (
    <AppLayout 
      variant="minimal" 
      isRecording={isRecording}
      backgroundIntensity="high"
      showBackground={true}
      className={className}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          {children}
        </motion.div>
      </div>
    </AppLayout>
  );
};

// Container component for consistent spacing and max-width
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  centerContent?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className,
  centerContent = false
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      centerContent && 'flex items-center justify-center min-h-full',
      className
    )}>
      {children}
    </div>
  );
};

export default AppLayout;