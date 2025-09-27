import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIMING, EASING, SPRINGS, modalAnimations } from '@/lib/animations';
import { 
  Mic, 
  MicOff, 
  Square, 
  Send, 
  Type, 
  Volume2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Keyboard,
  Brain,
  X,
  Zap,
  Waves
} from 'lucide-react';
import { Dialog, CaptureModal as DialogCaptureModal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCapture } from '@/contexts/CaptureContext';
import { useCaptureShortcuts, useShortcutHelpers } from '@/hooks/useGlobalShortcuts';
import { useTranscription } from '@/hooks/useTranscription';
import { VoiceWaveform, CircularWaveform } from '@/components/capture/VoiceWaveform';
import { cn } from '@/lib/utils';

interface CaptureModalProps {
  className?: string;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({ className }) => {
  const { 
    state, 
    closeCapture, 
    toggleRecording, 
    updateText, 
    setFinalText, 
    saveThought,
    clearCapture,
    clearError,
    getAudioLevel,
    hasAudioSupport,
    hasSpeechSupport 
  } = useCapture();

  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationFrameRef = useRef<number>();

  const { shortcuts } = useCaptureShortcuts();
  const { formatShortcut } = useShortcutHelpers();
  
  // Transcription integration
  const transcription = useTranscription({
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.4,
  });

  // Update final text when input changes
  useEffect(() => {
    setFinalText(textInput);
  }, [textInput, setFinalText]);

  // Audio level monitoring for visualization
  useEffect(() => {
    if (state.isRecording) {
      const updateAudioLevel = () => {
        setAudioLevel(getAudioLevel());
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isRecording, getAudioLevel]);

  // Ultra-fast focus for zero-friction experience
  useEffect(() => {
    if (state.isOpen && textareaRef.current) {
      // Immediate focus using requestAnimationFrame for <100ms performance
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        // Additional optimization: select any existing text
        if (textareaRef.current?.value) {
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
      });
    }
  }, [state.isOpen]);

  // Handle text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  // Handle save
  const handleSave = () => {
    if (textInput.trim() || state.audioBlob) {
      saveThought();
    }
  };

  // Handle clear
  const handleClear = () => {
    setTextInput('');
    clearCapture();
  };

  // Mode switching
  const switchMode = (newMode: 'voice' | 'text' | 'mixed') => {
    // Mode switching logic could be implemented here
    console.log('Switching to mode:', newMode);
  };

  const canSave = textInput.trim().length > 0 || state.audioBlob !== null || transcription.hasFinalText;
  const hasContent = textInput.trim().length > 0 || transcription.currentText.length > 0 || transcription.finalText.length > 0;

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => !open && closeCapture()}>
      <DialogCaptureModal
        isRecording={state.isRecording}
        size="lg"
        className={cn("w-full max-w-2xl", className)}
      >
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 glass-strong rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain className="w-5 h-5 text-blue-400" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-white">Capture Thought</h2>
                <p className="text-sm text-white/60">
                  {state.mode === 'voice' ? 'Voice recording mode' :
                   state.mode === 'text' ? 'Text input mode' :
                   'Voice & text mode'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Help toggle */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-white/60 hover:text-white/80"
              >
                <Keyboard className="w-4 h-4" />
              </Button>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={closeCapture}
                className="text-white/60 hover:text-white/80"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: TIMING.lightning,
                  ease: EASING.glass
                }}
                className="glass-card p-4 space-y-2"
              >
                <h3 className="text-sm font-medium text-white">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                  <div><kbd className="kbd">{formatShortcut('Space')}</kbd> Toggle recording</div>
                  <div><kbd className="kbd">{formatShortcut('Ctrl+Enter')}</kbd> Save thought</div>
                  <div><kbd className="kbd">{formatShortcut('Escape')}</kbd> Close modal</div>
                  <div><kbd className="kbd">{formatShortcut('Ctrl+K')}</kbd> Clear content</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Display */}
          <AnimatePresence>
            {state.showSuccess && (
              <motion.div
                className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{
                  duration: TIMING.lightning,
                  ease: EASING.apple,
                  type: 'spring',
                  ...SPRINGS.lightning
                }}
              >
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm flex-1">
                  Thought saved successfully! ✨
                </p>
                <motion.div
                  className="text-xs text-green-400/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  ID: {state.savedThoughtId?.slice(-8)}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {state.error && (
              <motion.div
                className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: TIMING.lightning,
                  ease: EASING.apple
                }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm flex-1">{state.error}</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Controls */}
          {(state.mode === 'voice' || state.mode === 'mixed') && (
            <div className="space-y-4">
              
              {/* Audio Level Visualization */}
              <AnimatePresence mode="wait">
                <motion.div
                  className="flex items-center justify-center py-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: TIMING.fast,
                    type: 'spring',
                    ...SPRINGS.lightning
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="relative">
                    <VoiceWaveform
                      isRecording={state.isRecording}
                      audioLevel={audioLevel}
                      width={280}
                      height={60}
                      barCount={20}
                      color={state.isRecording ? 'red' : 'gradient'}
                      className="rounded-xl"
                    />
                    
                    {/* Pulse effect overlay when recording */}
                    {state.isRecording && (
                      <motion.div
                        className="absolute inset-0 border-2 border-red-400/30 rounded-xl"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.5, 0.2, 0.5]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      />
                    )}
                    
                    {/* Audio level indicator */}
                    <motion.div
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: state.isRecording ? 1 : 0, y: state.isRecording ? 0 : 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center space-x-2 text-xs text-white/60 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Waves className="w-3 h-3" />
                        <span>{Math.round(audioLevel * 100)}%</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Recording Button */}
              <div className="flex justify-center">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Circular waveform background when recording */}
                  {state.isRecording && (
                    <motion.div
                      className="absolute -inset-6 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.4 }}
                    >
                      <CircularWaveform
                        isRecording={state.isRecording}
                        audioLevel={audioLevel}
                        size={120}
                      />
                    </motion.div>
                  )}
                  
                  <Button
                    variant={state.isRecording ? "ghost" : "orange"}
                    size="lg"
                    onClick={toggleRecording}
                    disabled={state.isProcessing || !hasAudioSupport || !transcription.isSupported}
                    leftIcon={
                      state.isRecording ? (
                        <Square className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )
                    }
                    className={cn(
                      "relative z-10 shadow-2xl transition-all duration-300",
                      state.isRecording 
                        ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/30" 
                        : "shadow-blue-500/20",
                      !transcription.isSupported && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="relative z-10">
                      {state.isRecording 
                        ? (transcription.isTranscribing ? 'Stop Recording' : 'Stop Recording') 
                        : (!transcription.isSupported ? 'Voice Not Supported' : 'Start Recording')}
                    </span>
                    
                    {/* Multiple pulse effects for recording */}
                    {state.isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-red-500/10 rounded-lg"
                          animate={{ 
                            scale: [1, 1.2, 1], 
                            opacity: [0.5, 0.1, 0.5] 
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-red-400/5 rounded-lg"
                          animate={{ 
                            scale: [1.1, 1.3, 1.1], 
                            opacity: [0.3, 0.05, 0.3] 
                          }}
                          transition={{ 
                            duration: 2.5, 
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                          }}
                        />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Recording Status */}
              <AnimatePresence>
                {state.isRecording && (
                  <motion.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      duration: TIMING.lightning,
                      ease: EASING.apple
                    }}
                  >
                    <div className="glass-card p-4 inline-block">
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          className="w-3 h-3 bg-red-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.6, 1]
                          }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <p className="text-sm text-white font-medium">
                          Recording in Progress
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-white/60">
                        <div className="flex items-center space-x-1">
                          <Mic className="w-3 h-3" />
                          <span>Live</span>
                        </div>
                        {transcription.isTranscribing && (
                          <div className="flex items-center space-x-1">
                            <Brain className="w-3 h-3" />
                            <span>Transcribing</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-white/50">
                      Press <kbd className="kbd">Space</kbd> to stop recording
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transcription Display */}
              <AnimatePresence>
                {(transcription.currentText || transcription.finalText) && (
                  <motion.div
                    className="glass-card p-4 space-y-3"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: TIMING.fast,
                      type: "spring",
                      ...SPRINGS.lightning,
                      ease: EASING.glass
                    }}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <motion.div
                          className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{ 
                            scale: transcription.isTranscribing ? [1, 1.3, 1] : 1,
                            opacity: transcription.isTranscribing ? [1, 0.7, 1] : 0.5
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: transcription.isTranscribing ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        />
                        <h4 className="text-sm font-medium text-white">Live Transcription</h4>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-white/60">
                        <div className="flex items-center space-x-1">
                          <Volume2 className="w-3 h-3" />
                          <motion.span
                            key={transcription.confidence}
                            initial={{ scale: 1.2, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {Math.round(transcription.confidence * 100)}%
                          </motion.span>
                        </div>
                        {!transcription.isSupported && (
                          <span className="text-red-400">Not supported</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3 min-h-[2rem]">
                      {/* Final text */}
                      {transcription.finalText && (
                        <motion.p
                          className="text-white text-sm leading-relaxed"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {transcription.finalText}
                        </motion.p>
                      )}
                      
                      {/* Interim text with typing animation */}
                      {transcription.currentText && transcription.currentText !== transcription.finalText && (
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-white/70 text-sm leading-relaxed italic">
                            {transcription.currentText}
                          </p>
                          {/* Typing cursor effect */}
                          <motion.span
                            className="inline-block w-0.5 h-4 bg-blue-400 ml-1"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Enhanced language and stats indicator */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="text-xs text-white/50">
                        Language: <span className="text-white/70">{transcription.language}</span>
                      </div>
                      <motion.div
                        className="text-xs text-white/50"
                        key={transcription.totalWords}
                        initial={{ scale: 1.1, color: '#60A5FA' }}
                        animate={{ scale: 1, color: '#FFFFFF80' }}
                        transition={{ duration: 0.4 }}
                      >
                        {transcription.totalWords} words
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transcription Error Display */}
              <AnimatePresence>
                {transcription.error && (
                  <motion.div
                    className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-3"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{
                      duration: TIMING.lightning,
                      ease: EASING.apple
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-yellow-400 text-sm font-medium">
                          Transcription Issue
                        </p>
                        <p className="text-yellow-400/80 text-xs">
                          {transcription.error}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => transcription.clear()}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Recovery actions */}
                    <div className="flex items-center space-x-2 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => transcription.start()}
                        disabled={!transcription.isSupported}
                        className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1"
                      >
                        Retry
                      </Button>
                      <span className="text-yellow-400/60">or continue typing</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Text Input */}
          {(state.mode === 'text' || state.mode === 'mixed') && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Your Thought</span>
              </div>
              
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={handleTextChange}
                placeholder="Start typing your thought, or use voice recording above..."
                className="w-full h-32 p-4 glass-strong border border-white/20 rounded-lg text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                disabled={state.isProcessing}
              />
              
              <div className="flex justify-between text-xs text-white/60">
                <span>
                  {textInput.length > 0 && `${textInput.split(/\s+/).filter(word => word.length > 0).length} words`}
                </span>
                <span>{textInput.length} characters</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              {/* Clear Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={state.isProcessing || !hasContent}
                className="text-white/60 hover:text-white/80"
              >
                Clear
              </Button>

              {/* Mode indicators */}
              <div className="flex items-center space-x-1 text-xs text-white/50">
                {!hasAudioSupport && <MicOff className="w-3 h-3" />}
                {!hasSpeechSupport && <span>No speech support</span>}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Processing indicator */}
              <AnimatePresence>
                {state.isProcessing && (
                  <motion.div
                    className="flex items-center space-x-2 text-sm text-white/70"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: TIMING.lightning,
                      ease: EASING.apple
                    }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <Button
                variant="orange"
                size="sm"
                onClick={handleSave}
                disabled={state.isProcessing || !canSave}
                leftIcon={<Send className="w-4 h-4" />}
                className="animate-pulse-glow"
              >
                Save Thought
              </Button>
            </div>
          </div>

          {/* Footer hint */}
          <div className="text-center text-xs text-white/50">
            Press <kbd className="kbd">{formatShortcut('Ctrl+Enter')}</kbd> to save quickly
          </div>
        </div>
      </DialogCaptureModal>
    </Dialog>
  );
};

export default CaptureModal;