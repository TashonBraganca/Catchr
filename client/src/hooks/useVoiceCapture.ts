import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceCaptureOptions {
  autoStart?: boolean;
  silenceThreshold?: number; // milliseconds
  continuous?: boolean;
  language?: string;
}

interface VoiceCaptureState {
  isRecording: boolean;
  transcribedText: string;
  confidence: number | null;
  isSupported: boolean;
  error: string | null;
}

interface VoiceCaptureControls {
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscription: () => void;
}

export function useVoiceCapture(options: VoiceCaptureOptions = {}): VoiceCaptureState & VoiceCaptureControls {
  const {
    autoStart = false,
    silenceThreshold = 2000,
    continuous = true,
    language = 'en-US'
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported || isInitializedRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition settings for optimal performance
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;

      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const resultConfidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          bestConfidence = Math.max(bestConfidence, resultConfidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Update state with the latest transcription
      const currentText = finalTranscript || interimTranscript;
      if (currentText) {
        setTranscribedText(currentText);
        setConfidence(bestConfidence || null);
        setError(null);

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Start new silence timer for auto-stop
        silenceTimerRef.current = setTimeout(() => {
          if (recognition && isRecording) {
            recognition.stop();
          }
        }, silenceThreshold);
      }
    };

    // Handle recognition start
    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    // Handle recognition end
    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    // Handle errors
    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    // Handle no speech detected
    recognition.onnomatch = () => {
      setError('No speech was detected');
    };

    recognitionRef.current = recognition;
    isInitializedRef.current = true;

    return () => {
      if (recognition) {
        recognition.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isSupported, continuous, language, silenceThreshold, isRecording]);

  // Auto-start recording if enabled
  useEffect(() => {
    if (autoStart && isSupported && recognitionRef.current && !isRecording) {
      startRecording();
    }
  }, [autoStart, isSupported, isRecording]);

  const startRecording = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isRecording) return;

    try {
      // Clear previous transcription
      setTranscribedText('');
      setConfidence(null);
      setError(null);

      // Start recognition
      recognitionRef.current.start();
    } catch (err) {
      setError(`Failed to start recording: ${err}`);
    }
  }, [isSupported, isRecording]);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      setError(`Failed to stop recording: ${err}`);
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [isRecording]);

  const clearTranscription = useCallback(() => {
    setTranscribedText('');
    setConfidence(null);
    setError(null);
  }, []);

  return {
    isRecording,
    transcribedText,
    confidence,
    isSupported,
    error,
    startRecording,
    stopRecording,
    clearTranscription
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}