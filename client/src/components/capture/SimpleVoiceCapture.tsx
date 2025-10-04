import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// SIMPLE VOICE CAPTURE - APPLE NOTES + GOOGLE KEEP INSPIRED
// Flow: Web Speech API → Whisper Fallback → GPT-5-mini → Save to Notes

interface SimpleVoiceCaptureProps {
  onTranscriptComplete?: (transcript: string, suggestedTitle?: string, suggestedTags?: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SimpleVoiceCapture: React.FC<SimpleVoiceCaptureProps> = ({
  onTranscriptComplete,
  onError,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Enhanced state for Reddit-inspired feedback (Google Keep insights)
  const [confidence, setConfidence] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [processingStage, setProcessingStage] = useState<'listening' | 'transcribing' | 'processing' | 'completed'>('listening');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false); // Progressive disclosure
  const [realtimeWords, setRealtimeWords] = useState<string[]>([]); // "Words as you speak" tracking

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize Web Speech API
  const initSpeechRecognition = useCallback(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let totalConfidence = 0;
        let resultCount = 0;

        // Process both interim and final results for real-time feedback
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            totalConfidence += event.results[i][0].confidence || 0.8; // Fallback confidence
            resultCount++;
          } else {
            // Show interim results for "words as you speak" experience
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update real-time words array for enhanced visualization
        const currentText = finalTranscript + interimTranscript;
        if (currentText) {
          const words = currentText.split(' ').filter(word => word.length > 0);
          setRealtimeWords(words);
        }

        if (finalTranscript) {
          const newText = finalTranscript;
          setTranscript(prev => prev + newText);
          setWordCount(prev => prev + newText.split(' ').filter(word => word.length > 0).length);

          // Enhanced confidence tracking (Reddit insight: visual feedback builds trust)
          if (resultCount > 0) {
            setConfidence(totalConfidence / resultCount);
            // Auto-show advanced stats if confidence is concerning
            if (totalConfidence / resultCount < 0.6) {
              setShowAdvancedStats(true);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        // Fall back to audio recording for Whisper
      };

      return recognition;
    }
    return null;
  }, []);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setTranscript('');
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio analysis for visual feedback
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      monitorAudioLevel();

      // Try Web Speech API first (Google Keep style)
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }

      // Always record audio as fallback (Whisper backup)
      // CRITICAL: Prioritize formats that work with Whisper API
      // MediaRecorder doesn't support WAV, but DOES support:
      // - audio/mp4 (Safari, good Whisper compatibility)
      // - audio/ogg (Firefox, acceptable Whisper compatibility)
      // - audio/webm (Chrome, has Opus codec issues with Whisper)

      const formatTests = [
        'audio/mp4',           // Best for Whisper (Safari default)
        'audio/ogg',           // Good for Whisper (Firefox)
        'audio/webm',          // Last resort - has Whisper issues
      ];

      let mimeType = 'audio/webm'; // Absolute fallback
      for (const format of formatTests) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          console.log(`✅ [Voice] Selected format: ${format} (Whisper compatible)`);
          break;
        }
      }

      console.log(`🎙️ [Voice] Using MIME type for recording: ${mimeType}`);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('Failed to access microphone');
      setIsRecording(false);
    }
  }, [initSpeechRecognition, monitorAudioLevel, onError]);

  // Stop recording and process
  const stopRecording = useCallback(async () => {
    console.log('🛑 [Voice] Stop recording triggered');
    setIsRecording(false);
    setIsProcessing(true);

    // Stop all recording
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log('🎤 [Voice] Speech recognition stopped');
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('📹 [Voice] Media recorder stopped');
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Process the recording with enhanced stages
    try {
      setProcessingStage('transcribing');
      let finalTranscript = transcript;

      console.log('📝 [Voice] Current transcript from Web Speech:', finalTranscript || 'EMPTY');
      console.log('🎙️ [Voice] Audio chunks recorded:', audioChunksRef.current.length);

      // If Web Speech API didn't work or gave poor results, use Whisper
      if (!finalTranscript || finalTranscript.length < 10) {
        console.log('🔄 [Voice] Falling back to Whisper API...');
        if (audioChunksRef.current.length > 0) {
          // Use the same MIME type as was used for recording
          const mimeType = audioChunksRef.current[0].type;
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('📦 [Voice] Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            mimeType: mimeType
          });

          finalTranscript = await transcribeWithWhisper(audioBlob);
          console.log('✅ [Voice] Whisper transcript received:', finalTranscript.substring(0, 100));
        } else {
          console.error('❌ [Voice] No audio chunks recorded!');
        }
      }

      if (finalTranscript && finalTranscript.length > 0) {
        setProcessingStage('processing');
        console.log('🤖 [Voice] Processing with GPT-5 Nano...');

        // Use GPT-5 Nano for categorization and enhancement
        const aiResult = await processWithGPT(finalTranscript);
        console.log('✅ [Voice] GPT-5 Nano result:', aiResult);

        onTranscriptComplete?.(
          finalTranscript,
          aiResult.suggestedTitle,
          aiResult.suggestedTags
        );
      } else {
        console.error('❌ [Voice] No speech detected in recording');
        onError?.('No speech detected');
      }

    } catch (error) {
      console.error('❌ [Voice] Error processing recording:', error);
      onError?.('Failed to process recording');
    } finally {
      setIsProcessing(false);
      setTranscript('');
      setAudioLevel(0);
      setConfidence(0);
      setWordCount(0);
      setProcessingStage('completed');
    }
  }, [transcript, onTranscriptComplete, onError]);

  // Whisper transcription fallback
  const transcribeWithWhisper = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Whisper transcription failed');
    }

    const result = await response.json();
    return result.transcript || '';
  };

  // GPT-5-mini processing for categorization
  const processWithGPT = async (transcript: string) => {
    const response = await fetch('/api/voice/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });

    if (!response.ok) {
      throw new Error('GPT processing failed');
    }

    return await response.json();
  };

  // Enhanced waveform visualization (Research insight: more responsive and polished)
  const WaveformBars = () => {
    // Create more natural waveform pattern based on actual audio levels
    const barHeights = Array.from({ length: 12 }, (_, i) => {
      if (!isRecording) return 4;

      // Create more natural wave pattern without Math.random()
      const baseHeight = audioLevel * 40;
      const waveOffset = Math.sin((Date.now() * 0.005) + (i * 0.5)) * 8;
      const barVariation = [1, 0.8, 1.2, 0.9, 1.1, 0.7, 1.3, 0.8, 1.1, 0.9, 1.2, 0.8][i];

      return Math.max(4, baseHeight * barVariation + waveOffset);
    });

    return (
      <div className="flex items-center space-x-1">
        {barHeights.map((height, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors duration-200",
              // Confidence-based color coding (Reddit insight: visual trust indicators)
              confidence > 0.8 ? "bg-green-500" :
              confidence > 0.6 ? "bg-[#007aff]" :
              confidence > 0 ? "bg-yellow-500" : "bg-[#007aff]"
            )}
            animate={{ height }}
            transition={{
              duration: 0.1,
              ease: "easeOut"
            }}
            style={{ height: Math.round(height) }}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center space-y-4 p-6 bg-white rounded-2xl border border-[#e5e5e7]",
        "shadow-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Recording Button */}
      <motion.button
        data-testid="voice-record-button"
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        className={cn(
          "relative w-20 h-20 rounded-full border-4 transition-all duration-200",
          "flex items-center justify-center",
          isRecording
            ? "bg-[#ff3b30] border-[#ff3b30] text-white"
            : "bg-white border-[#007aff] text-[#007aff] hover:bg-[#007aff]/5",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: isProcessing ? 1 : 1.05 }}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : isRecording ? (
            <motion.div
              className="w-6 h-6 bg-white rounded-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            />
          ) : (
            <motion.svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Status Text */}
      <div className="text-center">
        <motion.p
          data-testid="voice-status"
          className="text-lg font-medium text-[#1d1d1f]"
          animate={{ scale: isRecording ? 1.05 : 1 }}
        >
          {isProcessing
            ? processingStage === 'transcribing' ? 'Transcribing...' :
              processingStage === 'processing' ? 'Processing with AI...' : 'Processing...'
            : isRecording
              ? 'Recording...'
              : 'Tap to record'
          }
        </motion.p>
        <div className="text-sm text-[#8e8e93] mt-1 space-y-1">
          <p>
            {isProcessing
              ? processingStage === 'transcribing' ? 'Converting speech to text with Whisper AI' :
                processingStage === 'processing' ? 'Analyzing content with GPT-5-mini' :
                'Processing audio...'
              : isRecording
                ? 'Speak naturally - I\'m listening'
                : 'Tap to start voice capture'
            }
          </p>

          {/* Enhanced real-time stats (Reddit insight: instant feedback builds trust) */}
          {(isRecording && realtimeWords.length > 0) && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Primary stats always visible */}
              <div className="flex items-center justify-center space-x-4 text-xs">
                <span className="flex items-center space-x-1">
                  <span>📝</span>
                  <span>{realtimeWords.length} words</span>
                </span>
                {confidence > 0 && (
                  <motion.span
                    className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded-full",
                      confidence > 0.8 ? "bg-green-100 text-green-700" :
                      confidence > 0.6 ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    )}
                    animate={{ scale: confidence < 0.6 ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: confidence < 0.6 ? Infinity : 0 }}
                  >
                    <span>{confidence > 0.8 ? '🟢' : confidence > 0.6 ? '🔵' : '🟡'}</span>
                    <span>{Math.round(confidence * 100)}%</span>
                  </motion.span>
                )}

                {/* Progressive disclosure toggle */}
                <button
                  onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                  className="text-[#007aff] hover:text-[#0051d5] transition-colors"
                  aria-label="Toggle advanced statistics"
                >
                  {showAdvancedStats ? '📊 Less' : '📈 More'}
                </button>
              </div>

              {/* Advanced stats with progressive disclosure */}
              <AnimatePresence>
                {showAdvancedStats && (
                  <motion.div
                    className="flex items-center justify-center space-x-3 text-xs text-[#8e8e93] p-2 bg-[#f8f9fa] rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <span>⏱️ {Math.floor(realtimeWords.length / 2.5)}/min</span>
                    <span>🎚️ {Math.round(audioLevel * 100)}% level</span>
                    <span>🧠 {processingStage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div
            className="flex items-center justify-center h-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <WaveformBars />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Live Transcript Preview (Reddit insight: Google Keep real-time feedback) */}
      <AnimatePresence>
        {transcript && isRecording && (
          <motion.div
            className="w-full max-w-md p-4 liquid-glass liquid-glass--rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#007aff]">🎤 Live transcript</p>
              {confidence > 0 && (
                <div className={cn(
                  "flex items-center space-x-1 text-xs px-2 py-1 rounded-full",
                  confidence > 0.8 ? "bg-green-100 text-green-700" :
                  confidence > 0.6 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                )}>
                  <span>{confidence > 0.8 ? '🟢' : confidence > 0.6 ? '🟡' : '🔴'}</span>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>

            <div className="text-sm text-[#1d1d1f] leading-relaxed mb-2">
              {/* Show real-time words with typing effect (Reddit insight: words as you speak) */}
              {realtimeWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className={cn(
                    "inline-block mr-1",
                    // Highlight recent words (last 3) for real-time feedback
                    index >= realtimeWords.length - 3 ? "text-[#007aff] font-medium" : ""
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                className="inline-block w-0.5 h-4 bg-[#007aff] ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#8e8e93] pt-2 border-t border-[#e5e5e7]">
              <span>{wordCount} words captured</span>
              <span>Auto-saving in 1s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SimpleVoiceCapture;