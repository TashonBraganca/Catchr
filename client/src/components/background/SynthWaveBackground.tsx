import React from 'react';
import { motion } from 'framer-motion';

interface SynthWaveBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

export const SynthWaveBackground: React.FC<SynthWaveBackgroundProps> = ({
  intensity = 'medium',
  speed = 'medium',
  className = ''
}) => {
  // Animation duration based on speed
  const durations = {
    slow: 20,
    medium: 12,
    fast: 8
  };

  // Opacity based on intensity
  const opacities = {
    low: 0.1,
    medium: 0.2, 
    high: 0.3
  };

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary Wave */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundColor: '#FF6B35',
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: durations[speed],
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          filter: 'blur(120px)',
          transform: 'scale(1.5)',
          opacity: opacities[intensity]
        }}
      />

      {/* Secondary Wave */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: [0, -360],
        }}
        transition={{
          duration: durations[speed] * 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          backgroundColor: `rgba(255, 107, 53, ${opacities[intensity] * 0.3})`,
          filter: 'blur(40px)'
        }}
      />

      {/* Tertiary Wave */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: ['-100%', '100%'],
          y: ['-10%', '10%']
        }}
        transition={{
          duration: durations[speed] * 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
        style={{
          backgroundColor: `rgba(255, 107, 53, ${opacities[intensity] * 0.2})`,
          filter: 'blur(60px)',
          transform: 'scale(0.8)'
        }}
      />

      {/* Particle Field */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: durations[speed] + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Voice Wavelength Visualization */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 bg-orange-500"
            style={{
              left: `${(i / 50) * 100}%`,
              width: '2%',
              height: '20%'
            }}
            animate={{
              scaleY: [
                0.2 + Math.random() * 0.3,
                0.8 + Math.random() * 0.4,
                0.2 + Math.random() * 0.3
              ],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.05,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Specialized background for recording state
export const RecordingBackground: React.FC<{ isRecording: boolean }> = ({ 
  isRecording 
}) => {
  if (!isRecording) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Pulsing red glow for recording */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at center, rgba(239, 68, 68, 0.1), transparent)',
            'radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent)',
            'radial-gradient(circle at center, rgba(239, 68, 68, 0.1), transparent)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Enhanced wavelength during recording */}
      <div className="absolute bottom-0 left-0 right-0 h-48">
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 bg-orange-500"
            style={{
              left: `${(i / 100) * 100}%`,
              width: '1%'
            }}
            animate={{
              scaleY: [
                0.1 + Math.random() * 0.2,
                1.2 + Math.random() * 0.8,
                0.1 + Math.random() * 0.2
              ],
              opacity: [0.4, 0.9, 0.4]
            }}
            transition={{
              duration: 0.2 + Math.random() * 0.3,
              repeat: Infinity,
              delay: i * 0.01,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Ambient background for quiet states
export const AmbientBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none">
    {/* Subtle floating orbs */}
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-orange-500/10"
        style={{
          width: `${100 + Math.random() * 200}px`,
          height: `${100 + Math.random() * 200}px`,
          left: `${Math.random() * 80}%`,
          top: `${Math.random() * 80}%`,
        }}
        animate={{
          x: [0, Math.random() * 100 - 50, 0],
          y: [0, Math.random() * 100 - 50, 0],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 15 + Math.random() * 10,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
);

export default SynthWaveBackground;