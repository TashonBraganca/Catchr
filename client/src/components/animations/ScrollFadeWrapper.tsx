import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useScrollFade, useStaggeredFade } from '@/hooks/useScrollAnimations';
import { cn } from '@/lib/utils';

interface ScrollFadeWrapperProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  margin?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
}

export const ScrollFadeWrapper: React.FC<ScrollFadeWrapperProps> = ({
  children,
  className,
  threshold = 0.1,
  margin = "0px",
  direction = 'up',
  distance = 20,
  duration = 0.6,
  delay = 0,
  once = false
}) => {
  const { ref, controls } = useScrollFade(threshold, margin);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return { y: distance };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        scale: 0.95,
        ...getInitialTransform()
      }}
      animate={controls}
      transition={{ 
        duration, 
        ease: "easeOut",
        delay 
      }}
    >
      {children}
    </motion.div>
  );
};

// Wrapper for staggered children animations
interface StaggeredFadeWrapperProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  threshold?: number;
  itemClassName?: string;
}

export const StaggeredFadeWrapper: React.FC<StaggeredFadeWrapperProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  threshold = 0.2,
  itemClassName
}) => {
  const { ref, controls } = useStaggeredFade(children, staggerDelay, threshold);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          custom={index}
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.9
          }}
          animate={controls}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Text animation component for character-by-character reveals
interface AnimatedTextProps {
  text: string;
  className?: string;
  staggerDelay?: number;
  threshold?: number;
  variant?: 'words' | 'characters';
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  staggerDelay = 0.03,
  threshold = 0.5,
  variant = 'characters'
}) => {
  const { ref, controls } = useScrollFade(threshold);

  const textArray = variant === 'words' ? text.split(' ') : text.split('');

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      {textArray.map((item, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ 
            opacity: 0, 
            y: 20,
            rotateX: -90
          }}
          animate={controls}
          transition={{
            delay: index * staggerDelay,
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          {item === ' ' ? '\u00A0' : item}
          {variant === 'words' && index < textArray.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </div>
  );
};

// Parallax wrapper component
interface ParallaxWrapperProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  direction?: 'up' | 'down';
}

export const ParallaxWrapper: React.FC<ParallaxWrapperProps> = ({
  children,
  speed = 0.5,
  className,
  direction = 'up'
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(
    scrollY, 
    [0, 1000], 
    direction === 'up' ? [0, -1000 * speed] : [0, 1000 * speed]
  );

  return (
    <motion.div
      className={className}
      style={{ y }}
    >
      {children}
    </motion.div>
  );
};

// Card reveal animation on scroll
interface ScrollRevealCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  threshold?: number;
}

export const ScrollRevealCard: React.FC<ScrollRevealCardProps> = ({
  children,
  className,
  index = 0,
  threshold = 0.1
}) => {
  const { ref, controls } = useScrollFade(threshold);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y: 60,
        scale: 0.8,
        rotateY: -15
      }}
      animate={controls}
      transition={{
        delay: index * 0.15,
        duration: 0.8,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{
        scale: 1.02,
        rotateY: 0,
        transition: { duration: 0.3 }
      }}
    >
      {children}
    </motion.div>
  );
};

// Progress indicator component
interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  color = '#FF6B35',
  height = 3
}) => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className={cn('fixed top-0 left-0 right-0 z-50 origin-left', className)}
      style={{
        scaleX: scrollYProgress,
        backgroundColor: color,
        height: `${height}px`
      }}
    />
  );
};

// Section reveal animation
interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  background?: boolean;
}

export const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  className,
  background = false
}) => {
  const { ref, controls } = useScrollFade(0.3);

  return (
    <motion.section
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        background && 'py-16 md:py-24',
        className
      )}
      initial={{
        opacity: 0,
        clipPath: 'inset(100% 0 0 0)'
      }}
      animate={controls}
      transition={{
        duration: 1,
        ease: "easeInOut"
      }}
    >
      {background && (
        <motion.div
          className="absolute inset-0 bg-orange-500/8"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.section>
  );
};

export default ScrollFadeWrapper;