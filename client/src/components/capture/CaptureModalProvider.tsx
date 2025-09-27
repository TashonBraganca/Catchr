import React, { useState, useEffect } from 'react';
import { useCapture } from '@/contexts/CaptureContext';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { TIMING } from '@/lib/animations';
import CaptureModal from './CaptureModal';
import LightningCaptureModal from './LightningCaptureModal';

interface CaptureModalProviderProps {
  children: React.ReactNode;
  // Performance preferences
  preferLightning?: boolean;
  enableUltraFast?: boolean;
  // Feature preferences
  enableFullFeatures?: boolean;
}

/**
 * Intelligent capture modal provider that switches between:
 * - LightningCaptureModal: <100ms ultra-fast for keyboard shortcuts
 * - CaptureModal: Full-featured for comprehensive capture workflows
 *
 * Automatically chooses optimal modal based on:
 * - How the modal was triggered (shortcut vs UI)
 * - User preferences
 * - Current capture mode requirements
 */

export const CaptureModalProvider: React.FC<CaptureModalProviderProps> = ({
  children,
  preferLightning = true,
  enableUltraFast = true,
  enableFullFeatures = true
}) => {
  const { state, openCapture, closeCapture } = useCapture();
  const [lastTriggerMethod, setLastTriggerMethod] = useState<'keyboard' | 'ui' | null>(null);
  const [performanceMode, setPerformanceMode] = useState<'lightning' | 'full'>('lightning');

  // Track performance metrics for optimization
  const [openTimes, setOpenTimes] = useState<number[]>([]);
  const [averageOpenTime, setAverageOpenTime] = useState<number>(0);

  // Enhanced global shortcuts with trigger tracking
  const shortcuts = useGlobalShortcuts({
    enableCapture: true,
    enableUltraFastCapture: enableUltraFast,
    usePlatformShortcuts: true,
    onQuickCapture: () => {
      setLastTriggerMethod('keyboard');
      const startTime = performance.now();

      // Use requestAnimationFrame for instant response
      requestAnimationFrame(() => {
        openCapture('mixed');

        // Track performance metrics
        const openTime = performance.now() - startTime;
        setOpenTimes(prev => [...prev.slice(-9), openTime]); // Keep last 10
      });
    },
    onVoiceCapture: () => {
      setLastTriggerMethod('keyboard');
      requestAnimationFrame(() => openCapture('voice'));
    },
    onTextCapture: () => {
      setLastTriggerMethod('keyboard');
      requestAnimationFrame(() => openCapture('text'));
    },
    onEscape: () => {
      closeCapture();
    }
  });

  // Calculate average open time for performance monitoring
  useEffect(() => {
    if (openTimes.length > 0) {
      const avg = openTimes.reduce((sum, time) => sum + time, 0) / openTimes.length;
      setAverageOpenTime(avg);
    }
  }, [openTimes]);

  // Intelligent modal selection based on context
  useEffect(() => {
    if (!state.isOpen) return;

    const shouldUseLightning =
      preferLightning &&
      enableUltraFast &&
      (
        lastTriggerMethod === 'keyboard' || // Keyboard shortcuts prefer lightning
        state.mode === 'text' || // Text mode works well with lightning
        averageOpenTime > TIMING.lightning * 1000 // Switch to lightning if performance is poor
      );

    setPerformanceMode(shouldUseLightning ? 'lightning' : 'full');
  }, [state.isOpen, lastTriggerMethod, preferLightning, enableUltraFast, averageOpenTime, state.mode]);

  // UI-triggered captures use full modal by default
  const handleUICapture = (mode: 'voice' | 'text' | 'mixed') => {
    setLastTriggerMethod('ui');
    openCapture(mode);
  };

  // Performance monitoring and debugging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && openTimes.length > 0) {
      const lastOpenTime = openTimes[openTimes.length - 1];
      if (lastOpenTime > TIMING.lightning * 1000) {
        console.warn(`⚡ Capture modal opened in ${lastOpenTime.toFixed(1)}ms (target: ${TIMING.lightning * 1000}ms)`);
      } else {
        console.log(`✅ Lightning-fast capture: ${lastOpenTime.toFixed(1)}ms`);
      }
    }
  }, [openTimes]);

  return (
    <>
      {children}

      {/* Render appropriate modal based on performance mode */}
      {enableUltraFast && performanceMode === 'lightning' ? (
        <LightningCaptureModal
          ultraFastMode={true}
          key="lightning-modal"
        />
      ) : enableFullFeatures ? (
        <CaptureModal
          key="full-modal"
        />
      ) : (
        <LightningCaptureModal
          ultraFastMode={false}
          key="fallback-modal"
        />
      )}

      {/* Development performance overlay */}
      {process.env.NODE_ENV === 'development' && averageOpenTime > 0 && (
        <div className="fixed bottom-4 left-4 z-[9999] p-2 bg-black/80 backdrop-blur-sm rounded-lg border border-orange-ultralight">
          <div className="text-xs text-white/70 space-y-1">
            <div>Modal: {performanceMode}</div>
            <div>Avg open: {averageOpenTime.toFixed(1)}ms</div>
            <div className={averageOpenTime <= TIMING.lightning * 1000 ? 'text-green-400' : 'text-red-400'}>
              Target: {TIMING.lightning * 1000}ms
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Context hook for UI components to trigger captures
 * This ensures UI triggers are tracked separately from keyboard shortcuts
 */
export const useCaptureUI = () => {
  const { openCapture, closeCapture, state } = useCapture();

  const openUICapture = (mode: 'voice' | 'text' | 'mixed') => {
    // Mark as UI-triggered (component will detect this via useEffect timing)
    setTimeout(() => openCapture(mode), 0);
  };

  return {
    openCapture: openUICapture,
    closeCapture,
    state,
    isOpen: state.isOpen
  };
};

export default CaptureModalProvider;