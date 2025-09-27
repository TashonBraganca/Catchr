import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, useAnimation, useInView, MotionValue } from 'framer-motion';

// Hook for scroll-based fade animations
export const useScrollFade = (threshold: number = 0.1, margin: string = "0px") => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    threshold, 
    margin,
    once: false // Allow re-triggering when scrolling back up
  });
  
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          ease: "easeOut"
        }
      });
    } else {
      controls.start({
        opacity: 0,
        y: 20,
        scale: 0.95,
        transition: {
          duration: 0.4,
          ease: "easeIn"
        }
      });
    }
  }, [isInView, controls]);
  
  return {
    ref,
    controls,
    isInView
  };
};

// Hook for staggered animations on multiple elements
export const useStaggeredFade = (
  items: any[],
  staggerDelay: number = 0.1,
  threshold: number = 0.2
) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold, once: false });
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start((i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: i * staggerDelay,
          duration: 0.5,
          ease: "easeOut"
        }
      }));
    } else {
      controls.start({
        opacity: 0,
        y: 30,
        scale: 0.9,
        transition: {
          duration: 0.3,
          ease: "easeIn"
        }
      });
    }
  }, [isInView, controls, staggerDelay]);
  
  return {
    ref,
    controls,
    isInView,
    itemCount: items.length
  };
};

// Hook for parallax scrolling effects
export const useParallax = (speed: number = 0.5) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed]);
  
  return y;
};

// Hook for scroll direction detection
export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      if (Math.abs(scrollY - lastScrollY) < 5) {
        return;
      }
      
      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      setLastScrollY(scrollY);
    };
    
    window.addEventListener('scroll', updateScrollDirection, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, [lastScrollY]);
  
  return scrollDirection;
};

// Hook for scroll progress indication
export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setProgress(Math.min(100, Math.max(0, progress)));
    };
    
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    
    return () => {
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);
  
  return progress;
};

// Hook for element visibility tracking
export const useElementVisibility = (
  threshold: number = 0.1,
  rootMargin: string = "0px"
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, hasBeenVisible]);
  
  return {
    ref,
    isVisible,
    hasBeenVisible
  };
};

// Hook for scroll-based value transformation
export const useScrollTransform = (
  inputRange: number[],
  outputRange: number[] | string[],
  options?: {
    clamp?: boolean;
  }
) => {
  const { scrollY } = useScroll();
  return useTransform(scrollY, inputRange, outputRange, options);
};

// Hook for smooth scroll to element
export const useSmoothScroll = () => {
  const scrollToElement = (
    elementId: string,
    offset: number = 0,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const targetPosition = element.offsetTop - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior
    });
  };
  
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior
    });
  };
  
  return {
    scrollToElement,
    scrollToTop
  };
};

// Hook for scroll-based navigation bar behavior
export const useScrollNavigation = (threshold: number = 50) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollDirection = useScrollDirection();
  const { scrollY } = useScroll();
  
  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      const atTop = latest < 10;
      setIsAtTop(atTop);
      
      if (atTop) {
        setIsVisible(true);
      } else if (latest > threshold) {
        setIsVisible(scrollDirection !== 'down');
      }
    });
    
    return unsubscribe;
  }, [scrollY, scrollDirection, threshold]);
  
  const navOpacity = useTransform(scrollY, [0, 50], [0.9, 0.95]);
  const navY = useTransform(scrollY, [0, 100], [0, -10]);
  
  return {
    isVisible,
    isAtTop,
    navOpacity,
    navY,
    scrollDirection
  };
};

// Hook for scroll-triggered animations with custom timing
export const useScrollTrigger = (
  triggerPoint: number = 0.5,
  animationConfig?: {
    duration?: number;
    ease?: string;
    once?: boolean;
  }
) => {
  const ref = useRef(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const controls = useAnimation();
  
  const {
    duration = 0.6,
    ease = "easeOut",
    once = false
  } = animationConfig || {};
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldTrigger = entry.isIntersecting && entry.intersectionRatio >= triggerPoint;
        
        if (shouldTrigger && (!once || !hasTriggered)) {
          controls.start({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration, ease }
          });
          
          if (once) {
            setHasTriggered(true);
          }
        } else if (!shouldTrigger && !once) {
          controls.start({
            opacity: 0,
            y: 20,
            scale: 0.95,
            transition: { duration: duration * 0.7, ease: "easeIn" }
          });
        }
      },
      {
        threshold: triggerPoint,
        rootMargin: "0px"
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [controls, triggerPoint, duration, ease, once, hasTriggered]);
  
  return {
    ref,
    controls,
    hasTriggered
  };
};