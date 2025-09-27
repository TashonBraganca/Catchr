import { useEffect, useRef, useState, useCallback } from 'react';
import { useCapture } from '@/contexts/CaptureContext';
import { TranscriptionService, isSpeechRecognitionSupported, detectUserLanguage } from '@/services/transcription';

interface TranscriptionHookOptions {
  autoStart?: boolean;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  confidenceThreshold?: number;
}

interface TranscriptionState {
  isTranscribing: boolean;
  isSupported: boolean;
  currentText: string;
  finalText: string;
  confidence: number;
  language: string;
  error: string | null;
}

/**
 * Hook to integrate Web Speech API transcription with the CaptureContext
 */
export const useTranscription = (options: TranscriptionHookOptions = {}) => {
  const {
    autoStart = false,
    language,
    continuous = true,
    interimResults = true,
    confidenceThreshold = 0.3,
  } = options;

  const { 
    state: captureState, 
    updateText, 
    setFinalText, 
    setError: setCaptureError 
  } = useCapture();

  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    isTranscribing: false,
    isSupported: isSpeechRecognitionSupported(),
    currentText: '',
    finalText: '',
    confidence: 0,
    language: language || detectUserLanguage(),
    error: null,
  });

  const transcriptionServiceRef = useRef<TranscriptionService | null>(null);
  const finalTextAccumulatorRef = useRef<string>('');
  const lastInterimTextRef = useRef<string>('');
  
  // Initialize transcription service
  useEffect(() => {
    if (!transcriptionState.isSupported) return;

    transcriptionServiceRef.current = new TranscriptionService({
      language: transcriptionState.language,
      continuous,
      interimResults,
      
      onStart: () => {
        console.log('Transcription started');
        setTranscriptionState(prev => ({
          ...prev,
          isTranscribing: true,
          error: null,
        }));
        finalTextAccumulatorRef.current = '';
        lastInterimTextRef.current = '';
      },

      onEnd: () => {
        console.log('Transcription ended');
        setTranscriptionState(prev => ({
          ...prev,
          isTranscribing: false,
        }));
      },

      onResult: (text: string, confidence: number, isFinal: boolean) => {
        console.log('Transcription result:', { text, confidence, isFinal });
        
        // Filter out results with very low confidence
        if (confidence < confidenceThreshold) {
          return;
        }

        setTranscriptionState(prev => ({
          ...prev,
          currentText: text,
          confidence,
        }));

        // Update capture context with interim results
        if (!isFinal) {
          // For interim results, combine accumulated final text with current interim
          const fullText = finalTextAccumulatorRef.current + text;
          updateText(fullText);
          lastInterimTextRef.current = text;
        } else {
          // For final results, add to accumulator and update final text
          finalTextAccumulatorRef.current += text + ' ';
          const finalText = finalTextAccumulatorRef.current.trim();
          
          setTranscriptionState(prev => ({
            ...prev,
            finalText,
          }));
          
          setFinalText(finalText);
          updateText(finalText);
          lastInterimTextRef.current = '';
        }
      },

      onError: (error) => {
        console.error('Transcription error:', error);
        const errorMessage = error.message || 'Speech recognition error occurred';
        
        setTranscriptionState(prev => ({
          ...prev,
          error: errorMessage,
          isTranscribing: false,
        }));
        
        setCaptureError(errorMessage);
      },

      onSpeechStart: () => {
        console.log('Speech detected');
      },

      onSpeechEnd: () => {
        console.log('Speech ended');
      },

      onNoMatch: () => {
        console.log('No speech match - trying again');
        // Don't treat this as an error, just continue listening
      },
    });

    return () => {
      transcriptionServiceRef.current?.dispose();
    };
  }, [
    transcriptionState.isSupported, 
    transcriptionState.language, 
    continuous, 
    interimResults, 
    confidenceThreshold,
    updateText,
    setFinalText,
    setCaptureError
  ]);

  // Auto-start when recording begins
  useEffect(() => {
    if (!transcriptionServiceRef.current) return;

    if (captureState.isRecording && !transcriptionState.isTranscribing) {
      if (captureState.mode === 'voice' || captureState.mode === 'mixed') {
        startTranscription();
      }
    } else if (!captureState.isRecording && transcriptionState.isTranscribing) {
      stopTranscription();
    }
  }, [captureState.isRecording, captureState.mode]);

  // Auto-start based on option
  useEffect(() => {
    if (autoStart && transcriptionServiceRef.current && !transcriptionState.isTranscribing) {
      startTranscription();
    }
  }, [autoStart]);

  // Control functions
  const startTranscription = useCallback(async () => {
    if (!transcriptionServiceRef.current || !transcriptionState.isSupported) {
      const error = 'Speech recognition not supported in this browser';
      setTranscriptionState(prev => ({ ...prev, error }));
      setCaptureError(error);
      return;
    }

    try {
      await transcriptionServiceRef.current.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription';
      setTranscriptionState(prev => ({ ...prev, error: errorMessage }));
      setCaptureError(errorMessage);
    }
  }, [transcriptionState.isSupported, setCaptureError]);

  const stopTranscription = useCallback(() => {
    transcriptionServiceRef.current?.stop();
  }, []);

  const abortTranscription = useCallback(() => {
    transcriptionServiceRef.current?.abort();
    finalTextAccumulatorRef.current = '';
    lastInterimTextRef.current = '';
    setTranscriptionState(prev => ({
      ...prev,
      currentText: '',
      finalText: '',
      confidence: 0,
      isTranscribing: false,
    }));
  }, []);

  const clearTranscription = useCallback(() => {
    finalTextAccumulatorRef.current = '';
    lastInterimTextRef.current = '';
    setTranscriptionState(prev => ({
      ...prev,
      currentText: '',
      finalText: '',
      confidence: 0,
    }));
    setFinalText('');
    updateText('');
  }, [setFinalText, updateText]);

  const changeLanguage = useCallback((newLanguage: string) => {
    const wasTranscribing = transcriptionState.isTranscribing;
    
    if (wasTranscribing) {
      stopTranscription();
    }
    
    setTranscriptionState(prev => ({
      ...prev,
      language: newLanguage,
    }));
    
    transcriptionServiceRef.current?.setLanguage(newLanguage);
    
    if (wasTranscribing) {
      // Restart with new language
      setTimeout(() => startTranscription(), 100);
    }
  }, [transcriptionState.isTranscribing, startTranscription, stopTranscription]);

  // Get current service state
  const getServiceState = useCallback(() => {
    return transcriptionServiceRef.current?.getState() || null;
  }, []);

  return {
    // State
    ...transcriptionState,
    
    // Actions
    start: startTranscription,
    stop: stopTranscription,
    abort: abortTranscription,
    clear: clearTranscription,
    changeLanguage,
    
    // Utils
    getServiceState,
    
    // Computed
    hasInterimText: lastInterimTextRef.current.length > 0,
    hasFinalText: finalTextAccumulatorRef.current.length > 0,
    totalWords: finalTextAccumulatorRef.current.split(/\s+/).filter(word => word.length > 0).length,
  };
};

/**
 * Hook specifically for transcription status and controls in the UI
 */
export const useTranscriptionStatus = () => {
  const { state } = useCapture();
  const transcription = useTranscription();
  
  return {
    canTranscribe: transcription.isSupported && (state.mode === 'voice' || state.mode === 'mixed'),
    isActive: transcription.isTranscribing && state.isRecording,
    hasContent: transcription.hasFinalText || transcription.hasInterimText,
    confidence: transcription.confidence,
    error: transcription.error,
    language: transcription.language,
  };
};

export default useTranscription;