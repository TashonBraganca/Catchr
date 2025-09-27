# 🛠 Troubleshooting Guide

*Comprehensive solutions for common issues with Catcher's orange-themed glassmorphism interface*

## 🎯 Quick Diagnostic Checklist

| Issue Category | Quick Check | Status |
|----------------|-------------|--------|
| **Modal Performance** | Does modal appear in <100ms? | ⚠️ Critical |
| **Typography** | Are Apple system fonts loading? | ✅ Required |
| **Orange Theme** | Is orange color palette (#FF6A00) active? | ✅ Required |
| **Voice Capture** | Does microphone permission work? | ⚠️ Critical |
| **AI Processing** | Are OpenAI GPT-4o-mini requests working? | ✅ Required |
| **Search Performance** | Do results appear in <200ms? | ⚠️ Critical |
| **Animation Smoothness** | Are animations running at 60fps? | ✅ Required |

---

## 🚨 Critical Performance Issues

### Modal Appearance >100ms (CRITICAL)

**Symptoms:**
- Capture modal takes longer than 100ms to appear
- Noticeable delay when pressing Cmd+K
- Janky or slow animation entrance

**Root Causes & Solutions:**

#### 1. Bundle Size Too Large
```bash
# Check bundle sizes
npm run build
npx vite-bundle-analyzer dist/

# Solution: Enable code splitting
# vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', '@headlessui/react']
        }
      }
    }
  }
});
```

#### 2. Heavy Glassmorphism Effects
```css
/* Problem: Complex backdrop filters */
.capture-modal {
  backdrop-filter: blur(40px) saturate(180%) contrast(120%);
  /* Too heavy for smooth performance */
}

/* Solution: Optimize blur effects */
.capture-modal {
  backdrop-filter: blur(20px);
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU acceleration */
}

/* Use simpler effects on lower-end devices */
@media (max-width: 768px) {
  .capture-modal {
    backdrop-filter: blur(12px);
  }
}
```

#### 3. Unoptimized Font Loading
```typescript
// Problem: Blocking font loads
import './styles/fonts.css'; // Blocks rendering

// Solution: Preload critical fonts
// index.html
<link rel="preload" href="/fonts/sf-pro-text.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/sf-pro-display.woff2" as="font" type="font/woff2" crossorigin>

// CSS with font-display: swap
@font-face {
  font-family: 'SF Pro Text';
  src: url('/fonts/sf-pro-text.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
}
```

#### 4. JavaScript Main Thread Blocking
```typescript
// Problem: Heavy synchronous operations
const processThought = (text: string) => {
  // Synchronous heavy processing blocks UI
  return expensiveAnalysis(text);
};

// Solution: Move to Web Workers or async chunks
const processThought = async (text: string) => {
  return new Promise(resolve => {
    // Use scheduler API for better performance
    if ('scheduler' in window && 'postTask' in scheduler) {
      scheduler.postTask(() => {
        resolve(expensiveAnalysis(text));
      }, { priority: 'background' });
    } else {
      setTimeout(() => resolve(expensiveAnalysis(text)), 0);
    }
  });
};
```

**Performance Testing:**
```javascript
// Add to capture modal component
const measureModalPerformance = () => {
  performance.mark('modal-start');

  // After modal renders
  requestAnimationFrame(() => {
    performance.mark('modal-end');
    performance.measure('modal-appearance', 'modal-start', 'modal-end');

    const measure = performance.getEntriesByName('modal-appearance')[0];
    console.log(`Modal appearance time: ${measure.duration}ms`);

    if (measure.duration > 100) {
      console.warn('🚨 CRITICAL: Modal appearance exceeds 100ms target');
    }
  });
};
```

---

## 🎨 Design System Issues

### Apple System Fonts Not Loading

**Symptoms:**
- Text appears in monospace or fallback fonts
- Inconsistent typography across components
- Text looks different from Apple/iOS interfaces

**Solutions:**

#### 1. Font Stack Configuration
```css
/* ❌ Problem: Incorrect font stack */
body {
  font-family: 'Roboto Mono', monospace;
}

/* ✅ Solution: Proper Apple system font stack */
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif !important;
}

/* Verify font loading */
.font-test {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
}

/* Debug font detection */
@supports not (font-family: -apple-system) {
  .font-fallback-warning {
    background: orange;
    color: white;
    padding: 10px;
    margin: 10px;
  }
  .font-fallback-warning::before {
    content: "⚠️ Apple system fonts not supported. Using fallback.";
  }
}
```

#### 2. Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // ❌ Wrong configuration
        'mono': ['Roboto Mono', 'monospace'],

        // ✅ Correct configuration
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        'mono': ['"SF Mono"', 'Monaco', '"Cascadia Code"', 'Consolas', 'monospace'], // Only for code/labels
      }
    }
  }
};
```

#### 3. Component-Level Font Fixes
```typescript
// Check and fix components with hardcoded fonts
const FontAuditScript = `
// Run in browser console to find monospace usage
const elements = document.querySelectorAll('*');
elements.forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.fontFamily.includes('mono') && !el.classList.contains('code') && !el.classList.contains('timestamp')) {
    console.warn('Found monospace font in non-code element:', el, style.fontFamily);
    el.style.border = '2px solid orange';
  }
});
`;

// Fix components
export const CaptureModal = () => {
  return (
    <div
      className="font-sans" // Ensure Apple fonts
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      {/* Content */}
    </div>
  );
};
```

### Orange Theme Colors Not Appearing

**Symptoms:**
- Colors appear as default blue/purple instead of orange
- CSS custom properties not working
- Theme inconsistency across components

**Solutions:**

#### 1. CSS Custom Properties Setup
```css
/* Problem: Missing or incorrect CSS variables */
:root {
  /* ❌ Wrong or missing variables */
  --primary: #3B82F6; /* Blue instead of orange */
}

/* ✅ Correct orange theme variables */
:root {
  --orange-primary: #FF6A00;
  --orange-hover: #FF8A33;
  --orange-subtle: #FFB080;
  --bg-black: #000000;
  --text-primary: #F5F5F5;
}

/* Verify variables are loaded */
.theme-debug {
  background: var(--orange-primary, red); /* Red fallback indicates missing var */
  color: var(--text-primary, blue); /* Blue fallback indicates missing var */
}
```

#### 2. Tailwind Theme Integration
```javascript
// tailwind.config.js - Ensure orange colors are defined
module.exports = {
  theme: {
    extend: {
      colors: {
        orange: {
          primary: '#FF6A00',
          hover: '#FF8A33',
          subtle: '#FFB080'
        },
        black: '#000000'
      }
    }
  }
};

// Use in components
<button className="bg-orange-primary hover:bg-orange-hover text-white">
  Capture Thought
</button>
```

#### 3. Component Theme Provider
```typescript
// Create theme context to ensure consistent orange theme
export const OrangeThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Force orange theme variables
    const root = document.documentElement;
    root.style.setProperty('--orange-primary', '#FF6A00');
    root.style.setProperty('--orange-hover', '#FF8A33');
    root.style.setProperty('--orange-subtle', '#FFB080');
    root.style.setProperty('--bg-black', '#000000');

    // Add theme class
    document.body.classList.add('orange-theme');

    return () => {
      document.body.classList.remove('orange-theme');
    };
  }, []);

  return <div className="orange-theme-provider">{children}</div>;
};
```

---

## 🎤 Voice Capture Issues

### Microphone Not Working

**Symptoms:**
- No voice input detected
- Permission denied errors
- Silent recording with no transcription

**Solutions:**

#### 1. Permission Issues
```typescript
// Problem: Not handling permission states properly
const startRecording = async () => {
  navigator.mediaDevices.getUserMedia({ audio: true }); // May fail silently
};

// Solution: Comprehensive permission handling
const startRecording = async () => {
  try {
    // Check permission status first
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

    if (permission.state === 'denied') {
      throw new Error('Microphone permission denied. Please enable in browser settings.');
    }

    if (permission.state === 'prompt') {
      // Show user-friendly prompt before requesting
      showMicrophonePrompt();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });

    // Success - setup recording
    setupRecording(stream);

  } catch (error) {
    handleMicrophoneError(error);
  }
};

const handleMicrophoneError = (error: any) => {
  const errorMap = {
    'NotAllowedError': 'Microphone access denied. Please allow microphone access in your browser settings.',
    'NotFoundError': 'No microphone found. Please connect a microphone and try again.',
    'NotReadableError': 'Microphone is busy or unavailable. Close other applications using the microphone.',
    'OverconstrainedError': 'Microphone constraints not supported. Trying with basic settings.'
  };

  const message = errorMap[error.name] || `Microphone error: ${error.message}`;
  showToast(message, 'error');
};
```

#### 2. HTTPS Requirement Issues
```typescript
// Problem: Voice capture only works over HTTPS
const checkHTTPS = () => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    showToast('Voice capture requires HTTPS. Please use a secure connection.', 'warning');
    return false;
  }
  return true;
};

// Solution: Development workaround and production enforcement
const initializeVoiceCapture = () => {
  if (!checkHTTPS()) {
    // Disable voice features or provide alternative
    disableVoiceFeatures();
    return;
  }

  setupVoiceCapture();
};

const disableVoiceFeatures = () => {
  // Hide microphone button and show explanation
  const micButton = document.querySelector('.mic-button');
  if (micButton) {
    micButton.style.display = 'none';
  }

  const explanation = document.createElement('div');
  explanation.innerHTML = `
    <div class="voice-disabled-notice">
      🔒 Voice capture requires HTTPS for security
      <br>
      <small>Use text input or enable HTTPS</small>
    </div>
  `;
  micButton?.parentNode?.appendChild(explanation);
};
```

### Web Speech API Not Working

**Symptoms:**
- No real-time transcription
- Speech recognition not starting
- Inconsistent results across browsers

**Solutions:**

#### 1. Browser Compatibility
```typescript
// Check browser support and provide fallbacks
const checkSpeechSupport = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Web Speech API not supported');
    return false;
  }

  return true;
};

const initializeSpeechRecognition = () => {
  if (!checkSpeechSupport()) {
    // Fallback to audio recording + server transcription
    setupAudioRecording();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Configuration for better reliability
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Handle different events
  recognition.onstart = () => {
    console.log('Speech recognition started');
    updateUI('recording');
  };

  recognition.onresult = handleSpeechResult;
  recognition.onerror = handleSpeechError;
  recognition.onend = handleSpeechEnd;

  return recognition;
};

const handleSpeechError = (event: any) => {
  const errorMap = {
    'no-speech': 'No speech detected. Please try speaking louder.',
    'audio-capture': 'Audio capture failed. Check microphone connection.',
    'not-allowed': 'Speech recognition not allowed. Check browser permissions.',
    'network': 'Network error. Check internet connection.'
  };

  const message = errorMap[event.error] || `Speech recognition error: ${event.error}`;
  showToast(message, 'error');

  // Auto-retry for network errors
  if (event.error === 'network') {
    setTimeout(retryRecognition, 2000);
  }
};
```

#### 2. Audio Recording Fallback
```typescript
// When Web Speech API fails, use audio recording + server transcription
const setupAudioRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const audioChunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await transcribeAudioOnServer(audioBlob);
    };

    return mediaRecorder;

  } catch (error) {
    console.error('Audio recording setup failed:', error);
    showToast('Unable to initialize audio recording', 'error');
  }
};

const transcribeAudioOnServer = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('language', 'en');

  try {
    showToast('Transcribing audio...', 'info');

    const response = await fetch('/api/transcription/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Transcription failed');

    const result = await response.json();

    // Update UI with transcribed text
    updateTranscriptionUI(result.data.text, result.data.confidence);

  } catch (error) {
    console.error('Server transcription failed:', error);
    showToast('Transcription failed. Please try typing instead.', 'error');
  }
};
```

---

## 🤖 AI Integration Issues

### OpenAI GPT-4o-mini Not Responding

**Symptoms:**
- AI enrichment requests failing
- Slow or no categorization
- API errors in console

**Solutions:**

#### 1. API Key and Configuration Issues
```typescript
// Problem: Invalid or expired API keys
const testOpenAIConnection = async () => {
  try {
    const response = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ test: true })
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.statusText}`);
    }

    console.log('✅ OpenAI connection successful');

  } catch (error) {
    console.error('❌ OpenAI connection failed:', error);
    showToast('AI services unavailable. Features will be limited.', 'warning');
  }
};

// Server-side debugging
// server/src/routes/ai.ts
app.post('/api/ai/test', async (req, res) => {
  try {
    // Test OpenAI connection
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 10
    });

    res.json({
      success: true,
      model: 'gpt-5-mini',
      usage: response.usage
    });

  } catch (error) {
    console.error('OpenAI test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});
```

#### 2. Rate Limiting Issues
```typescript
// Problem: Exceeding OpenAI rate limits
const handleRateLimit = async (retryCount = 0) => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    return await makeOpenAIRequest();
  } catch (error) {
    if (error.status === 429 && retryCount < maxRetries) {
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Rate limited. Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return handleRateLimit(retryCount + 1);
    }

    throw error;
  }
};

// Queue management for multiple requests
class OpenAIQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly REQUESTS_PER_MINUTE = 500; // GPT-4o-mini limit
  private requestTimes: number[] = [];

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check rate limit
      if (!this.canMakeRequest()) {
        await this.waitForRateLimit();
      }

      const request = this.queue.shift()!;
      this.requestTimes.push(Date.now());

      try {
        await request();
      } catch (error) {
        console.error('Queued request failed:', error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old timestamps
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);

    return this.requestTimes.length < this.REQUESTS_PER_MINUTE;
  }

  private async waitForRateLimit(): Promise<void> {
    const oldestRequest = this.requestTimes[0];
    const waitTime = 60000 - (Date.now() - oldestRequest) + 1000; // +1s buffer

    console.log(`Waiting ${waitTime}ms for rate limit reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
```

### HuggingFace Whisper Not Working

**Symptoms:**
- Audio transcription failing
- Long processing times
- Empty transcription results

**Solutions:**

#### 1. Model Loading Issues
```typescript
// Problem: Model not loaded or cold start delays
const warmUpWhisperModel = async () => {
  try {
    // Send a small test audio to warm up the model
    const testAudio = new ArrayBuffer(1024); // Minimal audio buffer

    const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'audio/wav'
      },
      body: testAudio
    });

    console.log('Whisper model warmed up');

  } catch (error) {
    console.warn('Whisper warmup failed:', error);
  }
};

// Call during app initialization
warmUpWhisperModel();
```

#### 2. Audio Format Issues
```typescript
// Problem: Unsupported audio formats
const convertAudioFormat = async (audioBlob: Blob): Promise<Blob> => {
  // Check if audio is in supported format
  const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];

  if (supportedTypes.includes(audioBlob.type)) {
    return audioBlob;
  }

  // Convert using Web Audio API
  try {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to WAV
    const wavBlob = await audioBufferToWav(audioBuffer);
    return wavBlob;

  } catch (error) {
    console.error('Audio conversion failed:', error);
    throw new Error('Unsupported audio format. Please try again.');
  }
};

const audioBufferToWav = (audioBuffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve) => {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    offlineContext.startRendering().then((renderedBuffer) => {
      const wav = encodeWAV(renderedBuffer);
      resolve(new Blob([wav], { type: 'audio/wav' }));
    });
  });
};
```

---

## 🔍 Search Performance Issues

### Search Results >200ms

**Symptoms:**
- Slow search response times
- UI freezing during search
- Poor search relevance

**Solutions:**

#### 1. Database Query Optimization
```sql
-- Problem: Missing or inefficient indexes
-- Solution: Add comprehensive search indexes

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_thoughts_search_vector
ON thoughts USING GIN(search_vector);

-- Compound index for user + search
CREATE INDEX CONCURRENTLY idx_thoughts_user_search
ON thoughts(user_id) INCLUDE (search_vector, content, tags);

-- Category-based search
CREATE INDEX CONCURRENTLY idx_thoughts_category_search
ON thoughts((category->>'main'), search_vector)
WHERE search_vector IS NOT NULL;

-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM thoughts
WHERE user_id = $1
  AND search_vector @@ plainto_tsquery('english', $2)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC
LIMIT 20;
```

#### 2. Client-Side Search Optimization
```typescript
// Problem: Blocking search on main thread
const searchThoughts = async (query: string) => {
  // Synchronous search blocks UI
  return thoughts.filter(t => t.content.includes(query));
};

// Solution: Debounced async search with virtual scrolling
import { useDeferredValue, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const useOptimizedSearch = (query: string, thoughts: Thought[]) => {
  const deferredQuery = useDeferredValue(query);

  const searchResults = useMemo(() => {
    if (!deferredQuery) return thoughts;

    // Use Web Workers for heavy search operations
    return new Promise(resolve => {
      const worker = new Worker('/search-worker.js');
      worker.postMessage({ query: deferredQuery, thoughts });
      worker.onmessage = (e) => {
        resolve(e.data.results);
        worker.terminate();
      };
    });
  }, [deferredQuery, thoughts]);

  return searchResults;
};

// search-worker.js
self.onmessage = function(e) {
  const { query, thoughts } = e.data;

  // Perform heavy search operations here
  const results = thoughts
    .filter(thought => {
      return thought.content.toLowerCase().includes(query.toLowerCase()) ||
             thought.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    })
    .sort((a, b) => {
      // Simple relevance scoring
      const aScore = calculateRelevanceScore(a, query);
      const bScore = calculateRelevanceScore(b, query);
      return bScore - aScore;
    });

  self.postMessage({ results });
};
```

#### 3. Search Caching Strategy
```typescript
// Cache search results for better performance
class SearchCache {
  private cache = new Map<string, { results: any[], timestamp: number }>();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  get(query: string): any[] | null {
    const cached = this.cache.get(query);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(query);
      return null;
    }

    return cached.results;
  }

  set(query: string, results: any[]): void {
    this.cache.set(query, {
      results,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

const searchWithCache = async (query: string): Promise<any[]> => {
  // Check cache first
  const cached = searchCache.get(query);
  if (cached) {
    return cached;
  }

  // Perform actual search
  const results = await performSearch(query);

  // Cache results
  searchCache.set(query, results);

  return results;
};
```

---

## 📊 Performance Monitoring

### Real-Time Performance Diagnostics

```typescript
// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): string {
    const id = `${label}-${Date.now()}`;
    performance.mark(`${id}-start`);
    return id;
  }

  endTiming(id: string): number {
    performance.mark(`${id}-end`);
    performance.measure(id, `${id}-start`, `${id}-end`);

    const measure = performance.getEntriesByName(id)[0];
    const duration = measure.duration;

    // Store metric
    const label = id.split('-')[0];
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Alert if performance is poor
    this.checkPerformanceThresholds(label, duration);

    return duration;
  }

  private checkPerformanceThresholds(label: string, duration: number) {
    const thresholds = {
      'modal-appearance': 100, // <100ms
      'search-results': 200,   // <200ms
      'ai-processing': 5000    // <5s
    };

    const threshold = thresholds[label];
    if (threshold && duration > threshold) {
      console.warn(`🚨 Performance issue: ${label} took ${duration}ms (threshold: ${threshold}ms)`);

      // Send to monitoring service
      this.reportPerformanceIssue(label, duration, threshold);
    }
  }

  private reportPerformanceIssue(label: string, duration: number, threshold: number) {
    // Send to error tracking service
    if (window.Sentry) {
      Sentry.captureMessage(`Performance threshold exceeded: ${label}`, 'warning', {
        extra: { duration, threshold, userAgent: navigator.userAgent }
      });
    }
  }

  getMetrics(label: string): { avg: number; max: number; min: number } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b) / values.length,
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }
}

// Usage throughout the app
const monitor = new PerformanceMonitor();

// In capture modal
const openModal = () => {
  const timingId = monitor.startTiming('modal-appearance');

  // Modal opening logic
  showModal();

  requestAnimationFrame(() => {
    monitor.endTiming(timingId);
  });
};

// In search component
const performSearch = async (query: string) => {
  const timingId = monitor.startTiming('search-results');

  const results = await searchAPI(query);

  monitor.endTiming(timingId);
  return results;
};
```

---

## 📞 Getting Help

### Debug Information Collection

```bash
# Collect system information for support
#!/bin/bash
# debug-info.sh

echo "🔍 Catcher Debug Information"
echo "=========================="

echo "Environment:"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"
echo "- OS: $(uname -a)"

echo -e "\nBrowser Information:"
echo "- User Agent: $(node -e "console.log(process.env.USER_AGENT || 'Not available')")"

echo -e "\nApplication Status:"
echo "- Health Check:"
curl -s http://localhost:3001/health | jq '.' 2>/dev/null || echo "API not responding"

echo -e "\nPerformance Metrics:"
node -e "
const stats = performance.getEntriesByType('measure');
stats.forEach(stat => console.log(\`- \${stat.name}: \${stat.duration}ms\`));
"

echo -e "\nConsole Errors (last 10):"
# Would need browser console access
echo "Check browser console for JavaScript errors"

echo -e "\nNetwork Status:"
ping -c 3 api.openai.com 2>/dev/null | tail -n 1 || echo "OpenAI API unreachable"
ping -c 3 api-inference.huggingface.co 2>/dev/null | tail -n 1 || echo "HuggingFace API unreachable"
```

### Contact & Support Resources

| Issue Type | Contact Method | Response Time |
|------------|----------------|---------------|
| **Critical Performance** | GitHub Issues (label: critical) | 2 hours |
| **Bug Reports** | GitHub Issues (label: bug) | 24 hours |
| **Feature Requests** | GitHub Discussions | 1 week |
| **General Questions** | Discord Community | Real-time |
| **Enterprise Support** | support@catcher.ai | 4 hours |

### Self-Service Resources

- **📖 Documentation**: All guides in `docs/` folder
- **💻 Code Examples**: `examples/` directory
- **🧪 Testing Tools**: `npm run test:performance`
- **🔍 Health Checks**: Visit `/health` endpoints
- **📊 Monitoring**: Check error tracking dashboard

---

*🛠 This troubleshooting guide covers the most common issues with Catcher's orange-themed glassmorphism interface, focusing on performance-critical problems like <100ms modal appearance, Apple system fonts, and AI integration issues. Follow these solutions to maintain optimal speed and zero friction user experience.*