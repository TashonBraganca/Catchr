// CATHCR Content Script - Modal Injection and Management
// Performance target: <100ms modal appearance

class CathcrContentScript {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.isRecording = false;
    this.recognition = null;
    this.currentTranscript = '';
    this.interimTranscript = '';

    this.setupMessageListener();
    this.setupKeyboardListeners();
    this.preloadModal(); // Performance optimization
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'open-capture-modal') {
        this.openModal(message.context);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  setupKeyboardListeners() {
    // Backup keyboard listener (if background script fails)
    document.addEventListener('keydown', (e) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        // Only trigger if not in input field
        const activeElement = document.activeElement;
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        if (!isInInput) {
          e.preventDefault();
          this.openModal();
        }
      }

      // Escape to close modal
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.closeModal();
      }
    });
  }

  preloadModal() {
    // Pre-create DOM structure for <100ms performance
    this.modalTemplate = this.createModalElement();
    // Don't append to DOM yet, just keep in memory
  }

  createModalElement() {
    const modal = document.createElement('div');
    modal.className = 'cathcr-capture-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cathcr-modal-title');

    modal.innerHTML = `
      <div class="cathcr-modal-backdrop">
        <div class="cathcr-modal-content">
          <!-- Header -->
          <div class="cathcr-modal-header">
            <div class="cathcr-icon">🧠</div>
            <h2 id="cathcr-modal-title" class="cathcr-modal-title">Capture Thought</h2>
            <button class="cathcr-close-btn" aria-label="Close modal" title="Close (Esc)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Main Input Area -->
          <div class="cathcr-input-container">
            <textarea
              id="cathcr-input"
              class="cathcr-input"
              placeholder="What's on your mind?"
              rows="4"
              aria-label="Thought input"
            ></textarea>

            <!-- Voice Controls -->
            <div class="cathcr-voice-controls">
              <button
                id="cathcr-mic-btn"
                class="cathcr-mic-btn"
                aria-label="Toggle voice recording"
                title="Space to toggle recording"
              >
                <svg class="mic-icon" width="20" height="20" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" fill="none" stroke-width="2"/>
                  <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
                  <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>

              <!-- Real-time transcription display -->
              <div id="cathcr-transcription" class="cathcr-transcription">
                <div class="transcription-text" aria-live="polite"></div>
                <div class="transcription-confidence">
                  <div class="confidence-dots"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="cathcr-actions">
            <div class="action-hints">
              <kbd>Cmd</kbd>+<kbd>Enter</kbd> to save • <kbd>Space</kbd> to record • <kbd>Esc</kbd> to close
            </div>
            <button id="cathcr-save-btn" class="cathcr-save-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 6L9 17L4 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Capture Thought
            </button>
          </div>

          <!-- Status indicator -->
          <div class="cathcr-status" id="cathcr-status"></div>
        </div>
      </div>
    `;

    return modal;
  }

  openModal(context = {}) {
    if (this.isOpen) return;

    // Performance measurement
    const startTime = performance.now();

    // Performance optimization: Use pre-created template
    this.modal = this.modalTemplate.cloneNode(true);
    this.setupModalEvents(this.modal);

    // Store context for later use
    this.context = context;

    // Append to DOM and animate in
    document.body.appendChild(this.modal);

    // Force reflow for smooth animation
    requestAnimationFrame(() => {
      this.modal.classList.add('cathcr-modal-open');
      this.focusInput();

      // Log performance
      const endTime = performance.now();
      console.log(`🚀 CATHCR modal opened in ${endTime - startTime}ms`);
    });

    this.isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Set up auto-resize for textarea
    const textarea = this.modal.querySelector('.cathcr-input');
    this.setupAutoResize(textarea);
  }

  closeModal() {
    if (!this.isOpen || !this.modal) return;

    // Stop any active recording
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clear transcripts
    this.currentTranscript = '';
    this.interimTranscript = '';

    // Animate out
    this.modal.classList.remove('cathcr-modal-open');

    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.isOpen = false;

      // Restore body scroll
      document.body.style.overflow = '';
    }, 200);
  }

  setupModalEvents(modal) {
    // Close button
    modal.querySelector('.cathcr-close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    // Backdrop click
    modal.querySelector('.cathcr-modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    // Save button
    modal.querySelector('.cathcr-save-btn').addEventListener('click', () => {
      this.saveThought();
    });

    // Microphone button
    modal.querySelector('.cathcr-mic-btn').addEventListener('click', () => {
      this.toggleRecording();
    });

    // Keyboard shortcuts
    modal.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        this.saveThought();
      }

      // Space to toggle recording (when not in textarea)
      if (e.key === ' ' && e.target !== modal.querySelector('.cathcr-input')) {
        e.preventDefault();
        this.toggleRecording();
      }

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
      }
    });

    // Input events for real-time feedback
    const textarea = modal.querySelector('.cathcr-input');
    textarea.addEventListener('input', (e) => {
      this.handleTextInput(e);
    });
  }

  setupAutoResize(textarea) {
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    };

    textarea.addEventListener('input', autoResize);
    autoResize(); // Initial resize
  }

  focusInput() {
    const input = this.modal.querySelector('.cathcr-input');
    if (input) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        input.focus();
        // Position cursor at end if there's existing text
        if (input.value) {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 100);
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      // Check for microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isRecording = true;
          this.updateRecordingUI(true);
          this.showStatus('🎤 Listening...', 'recording');
        };

        this.recognition.onresult = (event) => {
          this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.showStatus(`Error: ${event.error}`, 'error');
          this.stopRecording();
        };

        this.recognition.onend = () => {
          this.isRecording = false;
          this.updateRecordingUI(false);
          this.showStatus('', 'idle');
        };

        this.recognition.start();
      } else {
        throw new Error('Speech recognition not supported in this browser');
      }

      // Stop the stream (we only needed it for permission)
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error('Failed to start recording:', error);

      if (error.name === 'NotAllowedError') {
        this.showStatus('Microphone access denied', 'error');
      } else if (error.name === 'NotFoundError') {
        this.showStatus('No microphone found', 'error');
      } else {
        this.showStatus('Voice recognition failed', 'error');
      }
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.updateRecordingUI(false);

    // Finalize any interim transcript
    if (this.interimTranscript) {
      this.currentTranscript += this.interimTranscript + ' ';
      this.updateTextarea();
      this.interimTranscript = '';
    }
  }

  handleSpeechResult(event) {
    const textarea = this.modal.querySelector('.cathcr-input');
    const transcriptionEl = this.modal.querySelector('.transcription-text');
    const confidenceEl = this.modal.querySelector('.confidence-dots');

    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.5;

      if (result.isFinal) {
        finalTranscript += transcript + ' ';
        this.updateConfidenceDisplay(confidenceEl, confidence);
      } else {
        interimTranscript += transcript;
      }
    }

    // Update transcripts
    if (finalTranscript) {
      this.currentTranscript += finalTranscript;
      this.updateTextarea();
    }

    this.interimTranscript = interimTranscript;

    // Show interim results
    transcriptionEl.textContent = interimTranscript;

    // Auto-resize textarea
    this.setupAutoResize(textarea);
  }

  updateTextarea() {
    const textarea = this.modal.querySelector('.cathcr-input');
    textarea.value = this.currentTranscript;

    // Trigger input event for auto-resize
    textarea.dispatchEvent(new Event('input'));
  }

  updateRecordingUI(isRecording) {
    const micBtn = this.modal.querySelector('.cathcr-mic-btn');
    const transcriptionEl = this.modal.querySelector('.cathcr-transcription');

    if (isRecording) {
      micBtn.classList.add('recording');
      transcriptionEl.classList.add('active');
    } else {
      micBtn.classList.remove('recording');
      transcriptionEl.classList.remove('active');
    }
  }

  updateConfidenceDisplay(confidenceEl, confidence) {
    const dotsCount = Math.max(1, Math.floor(confidence * 5));
    confidenceEl.innerHTML = '•'.repeat(dotsCount);
    confidenceEl.style.opacity = Math.max(0.3, confidence);
  }

  handleTextInput(e) {
    const text = e.target.value;

    // Update current transcript to match textarea
    this.currentTranscript = text;

    // Show character count for long texts
    if (text.length > 200) {
      this.showStatus(`${text.length} characters`, 'info');
    } else {
      this.showStatus('', 'idle');
    }
  }

  async saveThought() {
    const textarea = this.modal.querySelector('.cathcr-input');
    const text = textarea.value.trim();

    if (!text) {
      this.showStatus('Please enter a thought to capture', 'warning');
      return;
    }

    this.showStatus('Saving...', 'saving');

    try {
      // Send to background script
      const response = await chrome.runtime.sendMessage({
        action: 'save-thought',
        data: {
          text,
          content: text,
          timestamp: Date.now(),
          method: this.isRecording || this.currentTranscript ? 'voice' : 'text',
          confidence: this.currentTranscript ? 0.9 : 1.0,
          context: this.context
        }
      });

      if (response && response.success) {
        this.showStatus('✨ Thought captured!', 'success');

        // Close modal after short delay
        setTimeout(() => {
          this.closeModal();
        }, 1200);
      } else {
        throw new Error(response?.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Failed to save thought:', error);
      this.showStatus('Failed to save. Try again?', 'error');

      // Re-enable save button after delay
      setTimeout(() => {
        this.showStatus('', 'idle');
      }, 3000);
    }
  }

  showStatus(message, type = 'info') {
    const statusEl = this.modal?.querySelector('#cathcr-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `cathcr-status cathcr-status-${type}`;

    // Auto-clear certain status types
    if (type === 'info' && message) {
      setTimeout(() => {
        if (statusEl.textContent === message) {
          statusEl.textContent = '';
          statusEl.className = 'cathcr-status';
        }
      }, 3000);
    }
  }
}

// Initialize content script only if we're in the top-level window
if (window.top === window && !window.cathcrContentScript) {
  window.cathcrContentScript = new CathcrContentScript();
  console.log('🧠 CATHCR content script initialized');
}