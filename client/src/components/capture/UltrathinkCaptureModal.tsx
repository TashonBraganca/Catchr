import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { useVoiceCapture } from '../../hooks/useVoiceCapture';
import { useAIEnrichment } from '../../hooks/useAIEnrichment';
import { useOptimisticUpdates } from '../../hooks/useOptimisticUpdates';

interface UltrathinkCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (thought: CapturedThought) => void;
}

interface CapturedThought {
  content: string;
  transcribedText?: string;
  confidence?: number;
  aiCategory?: string;
  aiTags?: string[];
  timestamp: Date;
}

// Pre-compiled animation variants for performance
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } }
};

export const UltrathinkCaptureModal: React.FC<UltrathinkCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  // Refs for performance optimization
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // State management
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom hooks for advanced functionality
  const {
    isRecording,
    transcribedText,
    confidence,
    startRecording,
    stopRecording,
    isSupported: isSpeechSupported
  } = useVoiceCapture({
    autoStart: isOpen,
    silenceThreshold: 2000,
    continuous: true
  });

  const {
    categorize,
    isProcessing: isAIProcessing,
    result: aiResult
  } = useAIEnrichment();

  const {
    optimisticUpdate,
    rollback
  } = useOptimisticUpdates();

  // Auto-focus textarea and start recording when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Use requestAnimationFrame for optimal timing
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        // Auto-start recording if speech is supported
        if (isSpeechSupported && !isRecording) {
          startRecording();
        }
      });
    }
  }, [isOpen, isSpeechSupported, isRecording, startRecording]);

  // Update content from transcription
  useEffect(() => {
    if (transcribedText && transcribedText !== content) {
      setContent(transcribedText);

      // Start background AI processing immediately
      if (!isAIProcessing) {
        categorize(transcribedText);
      }
    }
  }, [transcribedText, content, isAIProcessing, categorize]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleCapture();
      } else if (event.code === 'Space' && event.target === modalRef.current) {
        event.preventDefault();
        toggleRecording();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Optimized capture handler
  const handleCapture = useCallback(async () => {
    if (!content.trim()) return;

    setIsProcessing(true);

    const thought: CapturedThought = {
      content: content.trim(),
      transcribedText: transcribedText || undefined,
      confidence,
      aiCategory: aiResult?.category,
      aiTags: aiResult?.tags,
      timestamp: new Date()
    };

    try {
      // Optimistic update for instant feedback
      const optimisticResult = optimisticUpdate(thought);

      // Call the capture handler
      await onCapture(thought);

      // Success! Show celebration animation
      showSuccessAnimation();

      // Reset state
      setContent('');
      setIsProcessing(false);
      onClose();
    } catch (error) {
      // Rollback optimistic update
      rollback();
      setIsProcessing(false);
      console.error('Capture failed:', error);
    }
  }, [content, transcribedText, confidence, aiResult, optimisticUpdate, rollback, onCapture, onClose]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const showSuccessAnimation = useCallback(() => {
    // Create orange celebration particles
    const particles = Array.from({ length: 20 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-orange-400 rounded-full"
        initial={{
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1
        }}
        animate={{
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          scale: 0,
          opacity: 0
        }}
        transition={{
          duration: 0.8,
          ease: 'easeOut'
        }}
      />
    ));

    // Show particles briefly
    const particleContainer = document.createElement('div');
    particleContainer.className = 'fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]';
    document.body.appendChild(particleContainer);

    setTimeout(() => {
      document.body.removeChild(particleContainer);
    }, 1000);
  }, []);

  // Memoized confidence indicator
  const confidenceIndicator = useMemo(() => {
    if (!confidence) return null;

    const confidenceColor = confidence > 0.8 ? 'text-green-400' :
                           confidence > 0.6 ? 'text-yellow-400' :
                           'text-red-400';

    return (
      <div className={`text-xs ${confidenceColor} flex items-center gap-1`}>
        <div className="w-2 h-2 rounded-full bg-current"></div>
        {Math.round(confidence * 100)}% confidence
      </div>
    );
  }, [confidence]);

  // Memoized AI category preview
  const aiCategoryPreview = useMemo(() => {
    if (!aiResult?.category) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-orange-400"
      >
        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
        Suggested: {aiResult.category}
        {aiResult.folder && (
          <span className="text-orange-300">→ {aiResult.folder}</span>
        )}
      </motion.div>
    );
  }, [aiResult]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="hidden"
        ref={modalRef}
        tabIndex={-1}
      >
        {/* Optimized backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          variants={backdropVariants}
          onClick={onClose}
        />

        {/* Modal content with glassmorphism */}
        <motion.div
          className="relative w-full max-w-2xl bg-black/90 border border-orange-500/30 rounded-2xl shadow-2xl backdrop-blur-xl"
          variants={modalVariants}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                🧠
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Capture Thought</h2>
                <p className="text-sm text-orange-300">Speak or type your idea</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content area */}
          <div className="p-6 space-y-4">
            {/* Textarea with optimized rendering */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Whisper your thought..."
                className="w-full h-32 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl
                         text-white placeholder-orange-400/60 resize-none focus:outline-none
                         focus:border-orange-500/50 focus:bg-orange-500/10 transition-all
                         font-system text-base leading-relaxed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                }}
              />

              {/* Recording indicator */}
              {isRecording && (
                <motion.div
                  className="absolute top-4 right-4 flex items-center gap-2 text-orange-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs">Recording...</span>
                </motion.div>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {confidenceIndicator}
                {aiCategoryPreview}
              </div>

              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-300">
                  Space
                </kbd>
                <span className="text-xs text-orange-400">to record</span>
              </div>
            </div>
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between p-6 border-t border-orange-500/20">
            <div className="flex items-center gap-3">
              {/* Voice recording button */}
              <button
                onClick={toggleRecording}
                disabled={!isSpeechSupported}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                } ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* AI processing indicator */}
              {isAIProcessing && (
                <div className="flex items-center gap-2 text-orange-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">AI analyzing...</span>
                </div>
              )}
            </div>

            {/* Capture button */}
            <button
              onClick={handleCapture}
              disabled={!content.trim() || isProcessing}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium
                       hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Capture
                </>
              )}
            </button>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-6 text-xs text-orange-400/60">
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-orange-500/5 border border-orange-500/10 rounded text-[10px]">⌘</kbd>
                <kbd className="px-1 py-0.5 bg-orange-500/5 border border-orange-500/10 rounded text-[10px]">↵</kbd>
                <span>to capture</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-orange-500/5 border border-orange-500/10 rounded text-[10px]">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UltrathinkCaptureModal;