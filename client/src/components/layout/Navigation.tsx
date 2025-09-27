import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Settings, 
  User, 
  Menu, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavigationProps {
  isAuthenticated?: boolean;
  onCaptureClick?: () => void;
  onSearchClick?: () => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  isAuthenticated = false,
  onCaptureClick,
  onSearchClick,
  className
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  
  // Transform scroll position to navigation styles
  const navOpacity = useTransform(scrollY, [0, 50], [0.9, 0.95]);
  const navScale = useTransform(scrollY, [0, 50], [1, 0.98]);
  const navY = useTransform(scrollY, [0, 100], [0, -10]);
  const navBlur = useTransform(scrollY, [0, 50], [16, 24]);

  // Hide nav on scroll down, show on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', updateScrollDirection);
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [lastScrollY]);

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Brain },
    { label: 'Thoughts', href: '/thoughts', icon: Sparkles },
    { label: 'Search', href: '/search', icon: Search, onClick: onSearchClick },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className={cn(
            "fixed top-0 left-0 right-0 z-50 font-primary",
            className
          )}
          style={{
            opacity: navOpacity,
            scale: navScale,
            y: navY
          }}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <motion.div
            className="glass-strong border-white/10 border-b backdrop-blur-xl"
            style={{
              backdropFilter: navBlur.get() ? `blur(${navBlur.get()}px)` : 'blur(16px)'
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                
                {/* Logo */}
                <motion.div 
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <motion.div
                      className="w-8 h-8 rounded-lg glass-card flex items-center justify-center"
                      whileHover={{ 
                        boxShadow: "0 0 20px rgba(255, 107, 53, 0.5)" 
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Brain className="w-5 h-5 text-orange-400" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">
                    Cathcr
                  </span>
                </motion.div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                  {navigationItems.map((item, index) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors glass-button h-auto"
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: "rgba(255, 255, 255, 0.15)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        duration: 0.3 
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.a>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {/* Capture Button */}
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={onCaptureClick}
                    leftIcon={<Zap className="w-4 h-4" />}
                    className="hidden sm:flex animate-orange-glow font-primary"
                  >
                    Capture
                  </Button>

                  {/* User Menu */}
                  {isAuthenticated ? (
                    <motion.button
                      className="glass-button p-2 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <User className="w-5 h-5 text-white" />
                    </motion.button>
                  ) : (
                    <Button variant="outline" size="sm" className="font-primary">
                      Sign In
                    </Button>
                  )}

                  {/* Mobile Menu Button */}
                  <motion.button
                    className="md:hidden glass-button p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait">
                      {isMenuOpen ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Menu className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="md:hidden glass-strong border-white/10 border-b"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="px-4 py-4 space-y-2">
                  {navigationItems.map((item, index) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-white/80 hover:text-white transition-colors glass-button w-full text-left"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 10 }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.a>
                  ))}
                  
                  {/* Mobile Capture Button */}
                  <motion.div
                    className="pt-2 border-t border-white/10"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      variant="orange"
                      fullWidth
                      onClick={onCaptureClick}
                      leftIcon={<Zap className="w-4 h-4" />}
                      className="animate-pulse-glow"
                    >
                      Capture Thought
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

// Compact navigation for minimal layouts
export const CompactNavigation: React.FC<{
  onCaptureClick?: () => void;
  onBackClick?: () => void;
  title?: string;
}> = ({ onCaptureClick, onBackClick, title }) => {
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 30], [0.9, 0.95]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 font-primary"
      style={{ opacity: navOpacity }}
    >
      <div className="glass-strong border-white/10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              {onBackClick && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onBackClick}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {title && (
                <h1 className="text-lg font-semibold text-white">
                  {title}
                </h1>
              )}
            </div>

            <Button
              variant="orange" 
              size="sm"
              onClick={onCaptureClick}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Capture
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;