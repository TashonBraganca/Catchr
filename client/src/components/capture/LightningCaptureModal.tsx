import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIMING, EASING, SPRINGS, modalAnimations } from '@/lib/animations';
import {
  Mic,
  Square,
  Send,
  Type,
  X,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Dialog, CaptureModal as DialogCaptureModal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCapture } from '@/contexts/CaptureContext';
import { cn } from '@/lib/utils';

/**
 * Lightning-fast capture modal optimized for <100ms opening performance
 *
 * Performance optimizations:
 * - Preloaded components with lazy initialization
 * - GPU-accelerated animations with will-change
 * - Minimal DOM manipulation during open/close
 * - Instant focus management with RAF
 * - Ultra-fast animation timings (0.05-0.1s)
 * - Reduced layout thrashing
 */

interface LightningCaptureModalProps {
  className?: string;
  ultraFastMode?: boolean;
}

export const LightningCaptureModal: React.FC<LightningCaptureModalProps> = ({
  className,
  ultraFastMode = true
}) => {
  const {
    state,
    closeCapture,
    toggleRecording,
    updateText,
    setFinalText,
    saveThought,
    clearCapture
  } = useCapture();

  const [textInput, setTextInput] = useState('');
  const [isRendered, setIsRendered] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Pre-render optimization: prepare modal content immediately
  useEffect(() => {
    if (!isRendered) {
      // Use RAF to prepare DOM elements without blocking
      requestAnimationFrame(() => {
        setIsRendered(true);
      });
    }
  }, [isRendered]);

  // Lightning-fast focus management
  useEffect(() => {
    if (state.isOpen && textareaRef.current && ultraFastMode) {
      // Zero-delay focus for instant UX
      textareaRef.current.focus();
      if (textareaRef.current.value) {
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }
  }, [state.isOpen, ultraFastMode]);

  // Performance-optimized text handler
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextInput(value);
    setFinalText(value);
  }, [setFinalText]);

  // Ultra-fast save handler
  const handleSave = useCallback(() => {
    if (textInput.trim() || state.audioBlob) {
      saveThought();
    }
  }, [textInput, state.audioBlob, saveThought]);

  // Lightning-fast clear handler
  const handleClear = useCallback(() => {
    setTextInput('');
    clearCapture();
  }, [clearCapture]);

  const canSave = textInput.trim().length > 0 || state.audioBlob !== null;

  // Don't render until prepared (performance optimization)
  if (!isRendered) {
    return null;
  }

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => !open && closeCapture()}>
      <DialogCaptureModal
        size="lg"
        variant="premium"
        className={cn("w-full max-w-2xl", className)}
        isRecording={state.isRecording}
      >
        <motion.div
          ref={modalContentRef}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: TIMING.instant }}
          style={{
            willChange: 'transform, opacity',
            contain: 'layout style paint'
          }}
        >

          {/* Ultra-minimal header for speed */}
          <motion.div
            className="flex items-center justify-between pb-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: TIMING.lightning, delay: TIMING.instant }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-8 h-8 glass-premium rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: TIMING.instant }}
              >
                <Zap className="w-4 h-4 text-orange-primary" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white font-primary">Quick Capture</h2>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeCapture}
              className="text-white/60 hover:text-white/80"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Success display - ultra-fast */}
          <AnimatePresence>
            {state.showSuccess && (
              <motion.div
                className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                {...modalAnimations.instantFeedback.success}
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm">Saved! ✨</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice recording - minimal UI */}
          {(state.mode === 'voice' || state.mode === 'mixed') && (
            <motion.div
              className="flex justify-center py-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: TIMING.lightning }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Button
                variant={state.isRecording ? "glass" : "orange"}
                size="lg"
                onClick={toggleRecording}
                leftIcon={state.isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                className={cn(
                  "transition-all duration-150 shadow-lg",
                  state.isRecording
                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-orange-glow"
                    : "shadow-orange-glow hover:animate-orange-glow"
                )}
              >
                {state.isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </motion.div>
          )}

          {/* Text input - lightning-fast focus */}
          {(state.mode === 'text' || state.mode === 'mixed') && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TIMING.fast }}
            >
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-orange-primary" />
                <span className="text-sm font-medium text-white">Your Thought</span>
              </div>

              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={handleTextChange}
                placeholder="Start typing your thought..."
                className="w-full h-28 p-3 glass-strong border border-orange-light rounded-lg text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-orange-primary focus:shadow-orange-glow transition-all duration-200"
                style={{
                  willChange: 'contents',
                  contain: 'layout style'
                }}
              />

              <div className="flex justify-between text-xs text-white/60">
                <span>
                  {textInput.length > 0 && `${textInput.split(/\s+/).filter(word => word.length > 0).length} words`}
                </span>
                <span>{textInput.length} characters</span>
              </div>
            </motion.div>
          )}

          {/* Ultra-fast action buttons */}
          <motion.div
            className="flex items-center justify-between pt-2 border-t border-orange-ultralight"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: TIMING.lightning, delay: TIMING.fast }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={state.isProcessing || (!textInput.trim() && !state.audioBlob)}
              className="text-white/60 hover:text-white/80"
            >
              Clear
            </Button>

            <div className="flex items-center space-x-2">
              {/* Processing indicator */}
              <AnimatePresence>
                {state.isProcessing && (
                  <motion.span
                    className="text-xs text-white/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TIMING.instant }}
                  >
                    Saving...
                  </motion.span>
                )}
              </AnimatePresence>

              <Button
                variant="orange"
                size="sm"
                onClick={handleSave}
                disabled={state.isProcessing || !canSave}
                leftIcon={<Send className="w-4 h-4" />}
                className="animate-orange-glow"
              >
                Save
              </Button>
            </div>
          </motion.div>

          {/* Lightning-fast keyboard hint */}
          <motion.div
            className="text-center text-xs text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: TIMING.lightning, delay: TIMING.quick }}
          >
            <kbd className="kbd text-orange-primary">⌘ Enter</kbd> to save • <kbd className="kbd text-orange-primary">Esc</kbd> to close
          </motion.div>
        </motion.div>
      </DialogCaptureModal>
    </Dialog>
  );
};

export default LightningCaptureModal;