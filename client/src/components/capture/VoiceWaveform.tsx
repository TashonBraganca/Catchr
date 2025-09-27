import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TIMING, EASING, SPRINGS } from '@/lib/animations';

interface VoiceWaveformProps {
  isRecording?: boolean;
  audioLevel?: number;
  className?: string;
  width?: number;
  height?: number;
  barCount?: number;
  gap?: number;
  minHeight?: number;
  maxHeight?: number;
  // Pure orange color variants
  variant?: 'primary' | 'secondary' | 'accent' | 'tertiary' | 'bright' | 'neon' | 'glow';
  animated?: boolean;
  responsive?: boolean;
  // Performance options
  ultraFast?: boolean;
  glowEffect?: boolean;
  // Waveform styles
  style?: 'bars' | 'smooth' | 'gradient' | 'pulse';
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isRecording = false,
  audioLevel = 0,
  className,
  width = 200,
  height = 60,
  barCount = 20,
  gap = 2,
  minHeight = 4,
  maxHeight = 54,
  variant = 'primary',
  animated = true,
  responsive = true,
  ultraFast = false,
  glowEffect = true,
  style = 'bars',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const barsRef = useRef<number[]>(new Array(barCount).fill(minHeight));
  const [actualDimensions, setActualDimensions] = useState({ width, height });

  // Pure orange color system - NO BROWN TINTS!
  const orangeColors = {
    primary: '#FFA500', // Pure vibrant orange
    secondary: '#FFAB40', // Bright orange
    accent: '#FF8C00', // Deep orange
    tertiary: '#FFCC80', // Light orange
    bright: '#FF7F00', // Electric orange
    neon: '#FF6F00', // Intense orange
    glow: '#FFB347', // Soft orange glow
  };

  // Get colors for current variant
  const getVariantColors = (variant: string) => {
    const baseColor = orangeColors[variant as keyof typeof orangeColors] || orangeColors.primary;

    // Create lighter/darker versions dynamically
    return {
      primary: baseColor,
      recording: variant === 'neon' ? orangeColors.bright : orangeColors.neon,
      glow: variant === 'glow' ? baseColor : orangeColors.glow,
      shadow: baseColor
    };
  };

  const colors = getVariantColors(variant);

  // Handle responsive sizing
  useEffect(() => {
    if (!responsive || !canvasRef.current) return;

    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight || height;

      setActualDimensions({
        width: Math.min(containerWidth, width),
        height: containerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [responsive, width, height]);

  // Generate realistic audio data
  const generateAudioData = useCallback(() => {
    const bars = barsRef.current;
    const targetLevel = isRecording ? audioLevel : 0;

    for (let i = 0; i < bars.length; i++) {
      if (isRecording && targetLevel > 0) {
        // Create wave-like pattern with some randomness
        const waveOffset = Math.sin((Date.now() * 0.003) + (i * 0.3)) * 0.5 + 0.5;
        const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const baseLevel = (targetLevel * waveOffset * randomFactor);
        
        // Add some frequency-based variation (lower frequencies = higher bars in center)
        const frequencyWeight = Math.exp(-Math.pow((i - bars.length / 2) / (bars.length / 4), 2));
        const adjustedLevel = baseLevel * (0.3 + frequencyWeight * 0.7);
        
        const targetHeight = minHeight + (adjustedLevel * (maxHeight - minHeight));
        
        // Smooth transitions
        bars[i] += (targetHeight - bars[i]) * 0.3;
      } else {
        // Decay to minimum height when not recording
        bars[i] += (minHeight - bars[i]) * 0.1;
      }
    }
  }, [isRecording, audioLevel, minHeight, maxHeight]);

  // Canvas drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: canvasWidth, height: canvasHeight } = actualDimensions;
    
    // Set canvas size
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate bar dimensions
    const totalGapWidth = gap * (barCount - 1);
    const availableWidth = canvasWidth - totalGapWidth;
    const barWidth = Math.max(1, availableWidth / barCount);

    const bars = barsRef.current;

    // Pure orange colors - NO BROWN TINTS!
    const fillColor = isRecording ? colors.recording : colors.primary;
    const glowColor = colors.glow;

    // Draw different waveform styles
    if (style === 'smooth') {
      // Smooth curved waveform
      ctx.beginPath();
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + barWidth / 2;
        const barHeight = Math.max(2, Math.min(bars[i], maxHeight));
        const y = (canvasHeight - barHeight) / 2 + barHeight / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * (barWidth + gap) + barWidth / 2;
          const prevBarHeight = Math.max(2, Math.min(bars[i - 1], maxHeight));
          const prevY = (canvasHeight - prevBarHeight) / 2 + prevBarHeight / 2;

          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }

      ctx.stroke();
    } else if (style === 'pulse') {
      // Pulsing circles
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + barWidth / 2;
        const barHeight = Math.max(2, Math.min(bars[i], maxHeight));
        const y = canvasHeight / 2;
        const radius = (barHeight / maxHeight) * (barWidth / 2);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Pulse effect
        if (isRecording && glowEffect) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = radius * 2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    } else {
      // Standard bars (enhanced)
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const barHeight = Math.max(2, Math.min(bars[i], maxHeight));
        const y = (canvasHeight - barHeight) / 2;

        // Set fill style - pure orange
        ctx.fillStyle = fillColor;

        // Draw rounded rectangle
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();

        // Enhanced glow effect when recording
        if (isRecording && glowEffect && barHeight > minHeight * 1.5) {
          ctx.shadowColor = colors.shadow;
          ctx.shadowBlur = variant === 'neon' ? 12 : 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, radius);
          ctx.fill();

          // Double glow for neon variant
          if (variant === 'neon') {
            ctx.shadowColor = orangeColors.bright;
            ctx.shadowBlur = 16;
            ctx.fill();
          }

          // Reset shadow
          ctx.shadowBlur = 0;
        }
      }
    }
  }, [
    actualDimensions,
    barCount,
    gap,
    minHeight,
    maxHeight,
    variant,
    style,
    isRecording,
    glowEffect,
    colors,
    orangeColors
  ]);

  // Animation loop
  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      generateAudioData();
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animated, generateAudioData, draw]);

  // Static draw when not animated
  useEffect(() => {
    if (!animated) {
      generateAudioData();
      draw();
    }
  }, [animated, generateAudioData, draw, isRecording, audioLevel]);

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center",
        responsive && "w-full",
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: ultraFast ? TIMING.lightning : TIMING.fast,
        ease: EASING.glass,
        type: 'spring',
        ...(ultraFast ? SPRINGS.lightning : SPRINGS.smooth)
      }}
      style={{
        width: responsive ? '100%' : actualDimensions.width,
        height: actualDimensions.height,
        willChange: 'transform, opacity'
      }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "rounded-lg transition-all duration-200",
          isRecording && variant === 'neon' && "animate-orange-glow",
          isRecording && variant !== 'neon' && "animate-pulse"
        )}
        style={{
          width: actualDimensions.width,
          height: actualDimensions.height,
          filter: isRecording && glowEffect
            ? `drop-shadow(0 0 ${variant === 'neon' ? '16px' : '12px'} ${colors.shadow}40)`
            : 'none',
          willChange: isRecording ? 'filter' : 'auto',
          contain: 'layout style paint'
        }}
      />
    </motion.div>
  );
};

// Simplified version for smaller displays
export const MiniWaveform: React.FC<Omit<VoiceWaveformProps, 'width' | 'height' | 'barCount'>> = (props) => {
  return (
    <VoiceWaveform
      {...props}
      width={60}
      height={20}
      barCount={8}
      gap={1}
      minHeight={2}
      maxHeight={18}
      responsive={false}
    />
  );
};

// Enhanced circular waveform for recording button
interface CircularWaveformProps {
  isRecording?: boolean;
  audioLevel?: number;
  size?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'tertiary' | 'bright' | 'neon' | 'glow';
  ultraFast?: boolean;
  glowEffect?: boolean;
}

export const CircularWaveform: React.FC<CircularWaveformProps> = ({
  isRecording = false,
  audioLevel = 0,
  size = 80,
  className,
  variant = 'primary',
  ultraFast = false,
  glowEffect = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const barsRef = useRef<number[]>(new Array(24).fill(0.1));

  // Pure orange color system for circular waveform
  const orangeColors = {
    primary: '#FFA500',
    secondary: '#FFAB40',
    accent: '#FF8C00',
    tertiary: '#FFCC80',
    bright: '#FF7F00',
    neon: '#FF6F00',
    glow: '#FFB347',
  };

  const colors = {
    primary: orangeColors[variant] || orangeColors.primary,
    recording: variant === 'neon' ? orangeColors.bright : orangeColors.neon,
    glow: orangeColors.glow,
  };

  const generateCircularData = useCallback(() => {
    const bars = barsRef.current;
    const targetLevel = isRecording ? audioLevel : 0;

    for (let i = 0; i < bars.length; i++) {
      if (isRecording && targetLevel > 0) {
        const waveOffset = Math.sin((Date.now() * 0.004) + (i * 0.26)) * 0.5 + 0.5;
        const randomFactor = Math.random() * 0.3 + 0.85;
        const level = (targetLevel * waveOffset * randomFactor) * 0.8 + 0.2;
        
        bars[i] += (level - bars[i]) * 0.3;
      } else {
        bars[i] += (0.1 - bars[i]) * 0.1;
      }
    }
  }, [isRecording, audioLevel]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = size * 0.15;
    const maxRadius = size * 0.4;

    const bars = barsRef.current;

    for (let i = 0; i < bars.length; i++) {
      const angle = (i / bars.length) * Math.PI * 2 - Math.PI / 2;
      const barLength = innerRadius + (bars[i] * (maxRadius - innerRadius));
      
      const startX = centerX + Math.cos(angle) * innerRadius;
      const startY = centerY + Math.sin(angle) * innerRadius;
      const endX = centerX + Math.cos(angle) * barLength;
      const endY = centerY + Math.sin(angle) * barLength;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = variant === 'neon' ? 3 : 2;
      ctx.strokeStyle = isRecording ? colors.recording : colors.primary;
      ctx.lineCap = 'round';

      if (isRecording && glowEffect) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = variant === 'neon' ? 8 : 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.stroke();

      // Double glow for neon variant
      if (isRecording && glowEffect && variant === 'neon') {
        ctx.shadowColor = orangeColors.bright;
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
  }, [size, isRecording, variant, colors, glowEffect, orangeColors]);

  useEffect(() => {
    const animate = () => {
      generateCircularData();
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [generateCircularData, draw]);

  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
      transition={{
        duration: ultraFast ? TIMING.lightning : TIMING.fast,
        type: 'spring',
        ...(ultraFast ? SPRINGS.lightning : SPRINGS.smooth),
        ease: EASING.glass
      }}
      style={{ willChange: 'transform, opacity' }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "transition-all duration-200",
          isRecording && variant === 'neon' && "animate-orange-glow"
        )}
        style={{
          width: size,
          height: size,
          filter: isRecording && glowEffect
            ? `drop-shadow(0 0 ${variant === 'neon' ? '16px' : '12px'} ${colors.glow}60)`
            : 'none',
          willChange: isRecording ? 'filter' : 'auto',
          contain: 'layout style paint'
        }}
      />
    </motion.div>
  );
};

export default VoiceWaveform;