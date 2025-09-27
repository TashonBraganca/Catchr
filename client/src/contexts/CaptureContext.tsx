import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, supabase } from '@/config/supabase';
import { TranscriptionService, TranscriptionResult } from '@/services/transcriptionService';
import { audioStorageService, AudioUploadProgress, AudioUploadResult } from '@/services/audioStorageService';

// Types for capture functionality
export interface CaptureState {
  isOpen: boolean;
  mode: 'voice' | 'text' | 'mixed';
  isRecording: boolean;
  isProcessing: boolean;
  transcriptionText: string;
  finalText: string;
  confidence: number;
  error: string | null;
  audioBlob: Blob | null;
  duration: number;
  startTime: Date | null;
  savedThoughtId: string | null;
  showSuccess: boolean;
  isTranscribing: boolean;
  audioLevel: number;
  transcriptionBackend: 'web_speech' | 'server_enhanced' | null;
  serverEnhancing: boolean;
  // Audio storage related
  isUploading: boolean;
  uploadProgress: AudioUploadProgress | null;
  audioUrl: string | null;
  audioPath: string | null;
}

export interface CaptureSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  hasAudio: boolean;
  hasText: boolean;
  totalDuration: number;
  wordCount: number;
}

interface CaptureContextType {
  // State
  state: CaptureState;
  session: CaptureSession | null;
  
  // Modal controls
  openCapture: (mode?: 'voice' | 'text' | 'mixed') => void;
  closeCapture: () => void;
  
  // Recording controls
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
  
  // Text handling
  updateText: (text: string) => void;
  setFinalText: (text: string) => void;
  
  // Processing
  saveThought: () => Promise<void>;
  clearCapture: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Audio
  getAudioLevel: () => number;
  hasAudioSupport: boolean;
  hasSpeechSupport: boolean;
}

const CaptureContext = createContext<CaptureContextType | undefined>(undefined);

// Initial state
const initialState: CaptureState = {
  isOpen: false,
  mode: 'mixed',
  isRecording: false,
  isProcessing: false,
  transcriptionText: '',
  finalText: '',
  confidence: 0,
  error: null,
  audioBlob: null,
  duration: 0,
  startTime: null,
  savedThoughtId: null,
  showSuccess: false,
  isTranscribing: false,
  audioLevel: 0,
  transcriptionBackend: null,
  serverEnhancing: false,
  // Audio storage related
  isUploading: false,
  uploadProgress: null,
  audioUrl: null,
  audioPath: null,
};

interface CaptureProviderProps {
  children: React.ReactNode;
}

export const CaptureProvider: React.FC<CaptureProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<CaptureState>(initialState);
  const [session, setSession] = useState<CaptureSession | null>(null);

  // Transcription service
  const transcriptionServiceRef = useRef<TranscriptionService | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Session tracking
  const sessionIdRef = useRef<string>('');
  const recordingStartRef = useRef<Date | null>(null);

  // Initialize transcription service
  useEffect(() => {
    transcriptionServiceRef.current = new TranscriptionService();

    // Setup event handlers
    transcriptionServiceRef.current.setEventHandlers({
      onResult: handleTranscriptionResult,
      onError: handleTranscriptionError,
      onStart: handleTranscriptionStart,
      onEnd: handleTranscriptionEnd,
      onAudioLevel: handleAudioLevel,
    });

    // Check browser support
    const status = transcriptionServiceRef.current.getStatus();
    console.log('Transcription capabilities:', status.capabilities);

    // Cleanup on unmount
    return () => {
      transcriptionServiceRef.current?.dispose();
    };
  }, []);

  // Transcription event handlers
  const handleTranscriptionResult = useCallback((result: TranscriptionResult) => {
    setState(prev => ({
      ...prev,
      transcriptionText: result.isFinal ? '' : result.text,
      finalText: result.isFinal ? result.text : prev.finalText,
      confidence: result.confidence,
      transcriptionBackend: result.backend,
      serverEnhancing: result.backend === 'server_enhanced',
    }));
  }, []);

  const handleTranscriptionError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      isTranscribing: false,
    }));
    console.error('Transcription error:', error);
  }, []);

  const handleTranscriptionStart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTranscribing: true,
      error: null,
    }));
  }, []);

  const handleTranscriptionEnd = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTranscribing: false,
    }));
  }, []);

  const handleAudioLevel = useCallback((level: number) => {
    setState(prev => ({
      ...prev,
      audioLevel: level,
    }));
  }, []);

  // Check browser support
  const hasAudioSupport = typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  const hasSpeechSupport = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Generate session ID
  const generateSessionId = () => `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Modal controls
  const openCapture = useCallback((mode: 'voice' | 'text' | 'mixed' = 'mixed') => {
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;
    
    const newSession: CaptureSession = {
      id: sessionId,
      startTime: new Date(),
      hasAudio: false,
      hasText: false,
      totalDuration: 0,
      wordCount: 0,
    };
    
    setSession(newSession);
    setState(prev => ({
      ...prev,
      isOpen: true,
      mode,
      startTime: new Date(),
      error: null,
    }));
  }, []);

  const closeCapture = useCallback(() => {
    // Clean up any ongoing recording
    if (state.isRecording) {
      stopRecording();
    }
    
    // Update session end time
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        endTime: new Date(),
        totalDuration: Date.now() - prev.startTime.getTime(),
        wordCount: state.finalText.split(/\s+/).filter(word => word.length > 0).length,
      } : null);
    }
    
    setState(initialState);
    setSession(null);
  }, [state.isRecording, session, state.finalText]);

  // Handle audio upload progress
  const handleUploadProgress = useCallback((progress: AudioUploadProgress) => {
    setState(prev => ({
      ...prev,
      uploadProgress: progress,
    }));
  }, []);

  // Upload audio to storage
  const uploadAudio = useCallback(async (audioBlob: Blob): Promise<AudioUploadResult | null> => {
    if (!user || !audioBlob) {
      console.warn('Cannot upload audio: missing user or audio blob');
      return null;
    }

    try {
      setState(prev => ({ ...prev, isUploading: true, error: null }));

      const result = await audioStorageService.uploadAudio(
        audioBlob,
        user.id,
        sessionIdRef.current,
        {
          compress: true,
          quality: 0.8,
          maxSizeKB: 5000,
          format: 'webm'
        },
        handleUploadProgress
      );

      setState(prev => ({
        ...prev,
        audioUrl: result.url,
        audioPath: result.path,
        isUploading: false,
        uploadProgress: null,
      }));

      console.log('Audio uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('Audio upload failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Audio upload failed',
        isUploading: false,
        uploadProgress: null,
      }));
      return null;
    }
  }, [user, handleUploadProgress]);

  // Audio level monitoring
  const getAudioLevel = useCallback((): number => {
    if (!analyserRef.current) return 0;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return sum / dataArray.length / 255; // Normalize to 0-1
  }, []);

  // Recording controls
  const startRecording = useCallback(async (): Promise<void> => {
    if (!hasAudioSupport || !user) {
      setError('Audio recording not supported or user not authenticated');
      return;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      audioStreamRef.current = stream;
      
      // Set up Web Audio API for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
        const duration = Date.now() - (recordingStartRef.current?.getTime() || Date.now());

        setState(prev => ({
          ...prev,
          audioBlob,
          duration
        }));

        // Update session
        if (session) {
          setSession(prev => prev ? { ...prev, hasAudio: true } : null);
        }

        // Automatically upload audio to storage
        const uploadResult = await uploadAudio(audioBlob);

        // If we have transcription service, enhance the transcription with server processing
        if (uploadResult && transcriptionServiceRef.current) {
          try {
            const enhancedResult = await transcriptionServiceRef.current.enhanceWithServer(audioBlob);
            if (enhancedResult && enhancedResult.text.length > state.finalText.length) {
              setState(prev => ({
                ...prev,
                finalText: enhancedResult.text,
                confidence: enhancedResult.confidence,
                transcriptionBackend: 'server_enhanced',
              }));
            }
          } catch (error) {
            console.warn('Server transcription enhancement failed:', error);
          }
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      recordingStartRef.current = new Date();
      
      // Start recording
      mediaRecorder.start(250); // Collect data every 250ms

      // Start transcription if in voice or mixed mode
      if (state.mode === 'voice' || state.mode === 'mixed') {
        try {
          await transcriptionServiceRef.current?.startTranscription();
        } catch (error) {
          console.warn('Failed to start transcription:', error);
        }
      }

      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        startTime: new Date(),
      }));
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [hasAudioSupport, user, session]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    // Stop transcription
    transcriptionServiceRef.current?.stopTranscription();

    // Clean up audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    recordingStartRef.current = null;

    setState(prev => ({
      ...prev,
      isRecording: false,
    }));
  }, [state.isRecording]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Text handling
  const updateText = useCallback((text: string) => {
    setState(prev => ({ ...prev, transcriptionText: text }));
  }, []);

  const setFinalText = useCallback((text: string) => {
    setState(prev => ({ ...prev, finalText: text }));
    
    // Update session
    if (session) {
      setSession(prev => prev ? { 
        ...prev, 
        hasText: text.length > 0,
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length 
      } : null);
    }
  }, [session]);

  // Processing and saving
  const saveThought = useCallback(async (): Promise<void> => {
    if (!user || (!state.finalText.trim() && !state.audioBlob)) {
      setError('No content to save');
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Prepare thought data matching the Thought interface
      const thoughtData = {
        content: state.finalText.trim(),
        transcribed_text: state.transcriptionText || null,
        type: 'note' as const,
        category: {
          main: 'uncategorized',
          subcategory: null,
          color: '#6366F1',
          icon: 'brain'
        },
        tags: [] as string[],
        // Include audio data if available
        audio_url: state.audioUrl || null,
        audio_path: state.audioPath || null,
        audio_duration: state.duration || null,
      };

      // Save to Supabase
      const savedThought = await db.createThought(thoughtData);

      console.log('Thought saved:', savedThought.id);

      // Show success feedback
      setState(prev => ({
        ...prev,
        error: null,
        savedThoughtId: savedThought.id,
        showSuccess: true,
        isProcessing: false
      }));

      // Close capture modal after showing success
      setTimeout(() => {
        closeCapture();
      }, 2000); // Allow time to see success state

    } catch (error) {
      console.error('Error saving thought:', error);
      setError(error instanceof Error ? error.message : 'Failed to save thought');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [user, state.finalText, state.audioBlob, state.transcriptionText, state.audioUrl, state.audioPath, state.duration, closeCapture]);

  const clearCapture = useCallback(() => {
    stopRecording();
    setState(prev => ({
      ...initialState,
      isOpen: prev.isOpen, // Keep modal open
      mode: prev.mode,
    }));
  }, [stopRecording]);

  // Error handling
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording]);

  const contextValue: CaptureContextType = {
    state,
    session,
    openCapture,
    closeCapture,
    startRecording,
    stopRecording,
    toggleRecording,
    updateText,
    setFinalText,
    saveThought,
    clearCapture,
    setError,
    clearError,
    getAudioLevel,
    hasAudioSupport,
    hasSpeechSupport,
  };

  return (
    <CaptureContext.Provider value={contextValue}>
      {children}
    </CaptureContext.Provider>
  );
};

// Custom hook to use capture context
export const useCapture = (): CaptureContextType => {
  const context = useContext(CaptureContext);
  
  if (context === undefined) {
    throw new Error('useCapture must be used within a CaptureProvider');
  }
  
  return context;
};

// Export types
export type { CaptureContextType };