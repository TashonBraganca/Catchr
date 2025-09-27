import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TIMING, EASING, SPRINGS } from '@/lib/animations';

/**
 * Comprehensive Orange Waveform Suite
 *
 * Specialized waveform components for different UI contexts:
 * - CompactWaveform: Ultra-minimal for status displays
 * - GlowWaveform: Intense orange glow effects
 * - RealtimeWaveform: High-performance real-time audio visualization
 * - SpectrumWaveform: Frequency spectrum visualization
 * - PulseWaveform: Heartbeat-style pulse animation
 */

// Pure Orange Color System - NO BROWN TINTS!
const ORANGE_PALETTE = {
  primary: '#FFA500',    // Pure vibrant orange
  secondary: '#FFAB40',  // Bright orange
  accent: '#FF8C00',     // Deep orange
  tertiary: '#FFCC80',   // Light orange
  bright: '#FF7F00',     // Electric orange
  neon: '#FF6F00',       // Intense orange
  glow: '#FFB347',       // Soft orange glow
  electric: '#FF4500',   // Red-orange electric
} as const;

// Ultra-compact waveform for status bars and mini displays
interface CompactWaveformProps {
  isActive?: boolean;
  audioLevel?: number;
  variant?: keyof typeof ORANGE_PALETTE;
  className?: string;
  ultraFast?: boolean;
}

export const CompactWaveform: React.FC<CompactWaveformProps> = ({
  isActive = false,
  audioLevel = 0,
  variant = 'primary',
  className,
  ultraFast = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const barsRef = useRef<number[]>([0.2, 0.4, 0.8, 0.6, 0.3]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 32;
    const height = 12;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    const barWidth = 4;
    const gap = 2;
    const bars = barsRef.current;
    const color = ORANGE_PALETTE[variant];

    for (let i = 0; i < bars.length; i++) {
      const x = i * (barWidth + gap);
      const targetLevel = isActive ? audioLevel + Math.random() * 0.3 : 0.1;

      // Smooth interpolation
      bars[i] += (targetLevel - bars[i]) * 0.3;

      const barHeight = Math.max(2, bars[i] * height);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [isActive, audioLevel, variant]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={cn("rounded", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: ultraFast ? TIMING.instant : TIMING.lightning,
        ease: EASING.glass
      }}
      style={{ willChange: 'transform, opacity' }}
    />
  );
};

// High-intensity glow waveform for dramatic effects
interface GlowWaveformProps {
  isRecording?: boolean;
  audioLevel?: number;
  width?: number;
  height?: number;
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  className?: string;
  ultraFast?: boolean;
}

export const GlowWaveform: React.FC<GlowWaveformProps> = ({
  isRecording = false,
  audioLevel = 0,
  width = 200,
  height = 60,
  intensity = 'high',
  className,
  ultraFast = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const barsRef = useRef<number[]>(new Array(20).fill(0.1));

  const intensityConfig = {
    low: { blur: 4, spread: 1 },
    medium: { blur: 8, spread: 2 },
    high: { blur: 12, spread: 3 },
    extreme: { blur: 20, spread: 4 }
  };

  const config = intensityConfig[intensity];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / barsRef.current.length - 2;
    const bars = barsRef.current;

    // Update bars with wave pattern
    for (let i = 0; i < bars.length; i++) {
      if (isRecording) {
        const wavePhase = (Date.now() * 0.005) + (i * 0.3);
        const wave = Math.sin(wavePhase) * 0.5 + 0.5;
        const targetLevel = (audioLevel * wave * (Math.random() * 0.4 + 0.8));
        bars[i] += (targetLevel - bars[i]) * 0.4;
      } else {
        bars[i] += (0.1 - bars[i]) * 0.1;
      }
    }

    // Draw with multiple glow layers
    for (let layer = 0; layer < config.spread; layer++) {
      ctx.shadowColor = ORANGE_PALETTE.neon;
      ctx.shadowBlur = config.blur * (layer + 1);

      for (let i = 0; i < bars.length; i++) {
        const x = i * (barWidth + 2);
        const barHeight = Math.max(4, bars[i] * (height - 10));
        const y = (height - barHeight) / 2;

        ctx.fillStyle = layer === 0 ? ORANGE_PALETTE.electric : ORANGE_PALETTE.glow;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    ctx.shadowBlur = 0;
  }, [isRecording, audioLevel, width, height, config]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: ultraFast ? TIMING.instant : TIMING.lightning,
        type: 'spring',
        ...SPRINGS.lightning
      }}
    >
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{
          filter: isRecording
            ? `drop-shadow(0 0 ${config.blur * 2}px ${ORANGE_PALETTE.neon}80)`
            : 'none',
          willChange: 'filter'
        }}
      />
    </motion.div>
  );
};

// Spectrum analyzer-style visualization
interface SpectrumWaveformProps {
  isActive?: boolean;
  frequencyData?: number[];
  width?: number;
  height?: number;
  barCount?: number;
  className?: string;
  style?: 'bars' | 'filled' | 'outline';
}

export const SpectrumWaveform: React.FC<SpectrumWaveformProps> = ({
  isActive = false,
  frequencyData = [],
  width = 300,
  height = 80,
  barCount = 32,
  className,
  style = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const barsRef = useRef<number[]>(new Array(barCount).fill(0));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / barCount - 1;
    const bars = barsRef.current;

    // Simulate frequency data if not provided
    for (let i = 0; i < barCount; i++) {
      let targetLevel;
      if (frequencyData.length > i) {
        targetLevel = frequencyData[i] / 255;
      } else if (isActive) {
        // Simulate frequency spectrum (lower frequencies higher)
        const freqWeight = Math.exp(-i * 0.1);
        targetLevel = freqWeight * (Math.random() * 0.6 + 0.2);
      } else {
        targetLevel = 0;
      }

      bars[i] += (targetLevel - bars[i]) * 0.3;
    }

    // Draw spectrum
    if (style === 'filled') {
      // Filled area under curve
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 1);
        const barHeight = bars[i] * height;
        ctx.lineTo(x, height - barHeight);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, ORANGE_PALETTE.neon + '80');
      gradient.addColorStop(1, ORANGE_PALETTE.primary + '20');
      ctx.fillStyle = gradient;
      ctx.fill();

    } else if (style === 'outline') {
      // Outline only
      ctx.beginPath();
      ctx.strokeStyle = ORANGE_PALETTE.bright;
      ctx.lineWidth = 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 1);
        const barHeight = bars[i] * height;
        if (i === 0) {
          ctx.moveTo(x, height - barHeight);
        } else {
          ctx.lineTo(x, height - barHeight);
        }
      }
      ctx.stroke();

    } else {
      // Standard bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 1);
        const barHeight = Math.max(2, bars[i] * height);
        const y = height - barHeight;

        // Color gradient based on frequency
        const hue = i / barCount;
        const color = hue < 0.3 ? ORANGE_PALETTE.accent :
                     hue < 0.6 ? ORANGE_PALETTE.primary :
                     ORANGE_PALETTE.bright;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }, [isActive, frequencyData, width, height, barCount, style]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={cn("rounded-lg", className)}
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{
        duration: TIMING.fast,
        ease: EASING.glass,
        type: 'spring',
        ...SPRINGS.smooth
      }}
      style={{ willChange: 'transform, opacity' }}
    />
  );
};

// Heartbeat/pulse style waveform
interface PulseWaveformProps {
  isActive?: boolean;
  bpm?: number; // beats per minute
  intensity?: number;
  size?: number;
  className?: string;
}

export const PulseWaveform: React.FC<PulseWaveformProps> = ({
  isActive = false,
  bpm = 60,
  intensity = 0.7,
  size = 60,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const pulseRef = useRef(0);

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

    if (!isActive) {
      pulseRef.current = 0;
      return;
    }

    // Calculate pulse based on BPM
    const secondsPerBeat = 60 / bpm;
    const pulseSpeed = (Date.now() * 0.001) / secondsPerBeat;
    const pulse = Math.sin(pulseSpeed * Math.PI * 2);
    const normalizedPulse = (pulse + 1) / 2; // 0 to 1

    // Create pulse effect
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size * 0.4;
    const radius = maxRadius * normalizedPulse * intensity;

    // Draw pulsing circle with glow
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, ORANGE_PALETTE.neon + 'FF');
    gradient.addColorStop(0.7, ORANGE_PALETTE.primary + '80');
    gradient.addColorStop(1, ORANGE_PALETTE.glow + '00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add outer glow
    ctx.shadowColor = ORANGE_PALETTE.electric;
    ctx.shadowBlur = radius * 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    pulseRef.current = normalizedPulse;
  }, [isActive, bpm, intensity, size]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={cn("rounded-full", className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: TIMING.lightning,
        type: 'spring',
        ...SPRINGS.lightning
      }}
      style={{
        filter: isActive
          ? `drop-shadow(0 0 ${size * 0.3}px ${ORANGE_PALETTE.neon}60)`
          : 'none',
        willChange: 'filter, transform, opacity'
      }}
    />
  );
};

export default {
  CompactWaveform,
  GlowWaveform,
  SpectrumWaveform,
  PulseWaveform,
};