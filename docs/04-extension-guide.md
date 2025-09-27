# 🔌 Chrome Extension Development Guide

*Building the global thought capture extension with orange-themed glassmorphism*

## 🎯 Extension Overview

The CATHCR Chrome extension provides **instant global access** to thought capture via Cmd+K shortcut, featuring:

- **Sub-100ms Modal Appearance** for zero-friction capture
- **Orange-Themed Glassmorphism** consistent with main app design
- **Offline-First Architecture** with automatic sync when online
- **Voice & Text Input** with real-time transcription
- **Apple System Fonts** throughout the interface

---

## 📁 Extension Structure

```
extension/
├── manifest.json              # Chrome MV3 configuration
├── background.js             # Service worker (global shortcuts, sync)
├── content-script.js         # DOM injection and modal logic
├── content-styles.css        # Orange-themed modal styles
├── popup.html               # Extension popup interface
├── popup.js                 # Popup functionality
├── icons/                   # Orange-tinted extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── lib/                     # Shared utilities
    ├── storage.js           # IndexedDB wrapper
    ├── sync.js              # Background sync logic
    └── audio.js             # Voice capture utilities
```

---

## ⚙️ Manifest Configuration (MV3)

### Complete manifest.json
```json
{
  "manifest_version": 3,
  "name": "CATHCR - Instant Thought Capture",
  "version": "1.0.0",
  "description": "Capture fleeting thoughts instantly with voice or text from anywhere on the web",

  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "notifications"
  ],

  "optional_permissions": [
    "microphone"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "css": ["content-styles.css"],
    "run_at": "document_idle"
  }],

  "commands": {
    "capture-thought": {
      "suggested_key": {
        "default": "Ctrl+Shift+C",
        "mac": "Command+K"
      },
      "description": "Open instant thought capture modal"
    }
  },

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "action": {
    "default_popup": "popup.html",
    "default_title": "Capture Thought",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png"
    }
  },

  "web_accessible_resources": [{
    "resources": ["icons/*.png", "content-styles.css"],
    "matches": ["<all_urls>"]
  }],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
  },

  "host_permissions": [
    "http://localhost:3001/*",
    "https://your-api-domain.com/*"
  ]
}
```

### Key Features Explained
- **MV3 Compliance**: Uses service worker instead of background page
- **Global Shortcuts**: Cmd+K (Mac) / Ctrl+Shift+C (Windows/Linux)
- **Minimal Permissions**: Only requests necessary access
- **Content Script Injection**: Runs on all pages for global capture
- **Optional Microphone**: Requested only when voice capture is used

---

## 🔧 Service Worker (background.js)

### Complete Background Script
```javascript
// CATHCR Extension Service Worker
// Handles global shortcuts, storage, and sync

import { StorageManager } from './lib/storage.js';
import { SyncManager } from './lib/sync.js';

class CatcherBackground {
  constructor() {
    this.storage = new StorageManager();
    this.sync = new SyncManager();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'capture-thought') {
        this.openCaptureModal();
      }
    });

    // Extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeExtension();
    });

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Online/offline sync management
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sync-status') {
        this.handleSyncStatusConnection(port);
      }
    });
  }

  async initializeExtension() {
    console.log('🧠 Catcher extension installed');

    // Initialize default settings
    await this.storage.setSettings({
      globalShortcuts: true,
      autoSync: true,
      offlineMode: true,
      voiceCapture: true,
      theme: 'orange',
      apiUrl: 'http://localhost:3001'
    });

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Catcher Ready! 🧠',
      message: 'Press Cmd+K anywhere to capture thoughts instantly'
    });
  }

  async openCaptureModal() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab?.id) {
        console.warn('No active tab found');
        return;
      }

      // Inject and open modal
      await chrome.tabs.sendMessage(tab.id, {
        action: 'open-capture-modal',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to open capture modal:', error);

      // Fallback: Open extension popup
      try {
        await chrome.action.openPopup();
      } catch (popupError) {
        console.error('Popup fallback also failed:', popupError);
      }
    }
  }

  async handleMessage(message, sender, sendResponse) {
    const { action, data } = message;

    switch (action) {
      case 'save-thought':
        await this.saveThought(data, sender);
        sendResponse({ success: true });
        break;

      case 'get-recent-thoughts':
        const thoughts = await this.storage.getRecentThoughts(data?.limit || 10);
        sendResponse({ thoughts });
        break;

      case 'sync-now':
        await this.sync.syncPendingThoughts();
        sendResponse({ success: true });
        break;

      case 'get-settings':
        const settings = await this.storage.getSettings();
        sendResponse({ settings });
        break;

      case 'update-settings':
        await this.storage.updateSettings(data);
        sendResponse({ success: true });
        break;

      default:
        console.warn('Unknown message action:', action);
        sendResponse({ error: 'Unknown action' });
    }
  }

  async saveThought(thoughtData, sender) {
    const thought = {
      id: this.generateId(),
      content: thoughtData.text,
      sourceUrl: sender.tab?.url,
      sourceTitle: sender.tab?.title,
      timestamp: thoughtData.timestamp || Date.now(),
      synced: false,
      metadata: {
        source: 'extension',
        userAgent: navigator.userAgent,
        captureMethod: thoughtData.method || 'text'
      }
    };

    try {
      // Save locally first (offline-first)
      await this.storage.saveThought(thought);

      // Add to sync queue
      await this.storage.addToSyncQueue(thought);

      // Attempt immediate sync if online
      if (navigator.onLine) {
        this.sync.syncPendingThoughts();
      }

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Thought Captured! ✨',
        message: thought.content.substring(0, 50) + (thought.content.length > 50 ? '...' : '')
      });

    } catch (error) {
      console.error('Failed to save thought:', error);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Save Failed 😞',
        message: 'Thought could not be saved. Please try again.'
      });
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleSyncStatusConnection(port) {
    // Send real-time sync status updates
    port.onMessage.addListener((message) => {
      if (message.action === 'get-sync-status') {
        this.sync.getSyncStatus().then(status => {
          port.postMessage({ syncStatus: status });
        });
      }
    });
  }
}

// Initialize background service
new CatcherBackground();

// Handle service worker lifecycle
self.addEventListener('activate', () => {
  console.log('🧠 Catcher service worker activated');
});
```

---

## 📝 Content Script (content-script.js)

### Modal Injection & Management
```javascript
// Catcher Content Script - Modal Injection
// Performance target: <100ms modal appearance

class CatcherContentScript {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.isRecording = false;
    this.recognition = null;

    this.setupMessageListener();
    this.setupKeyboardListeners();
    this.preloadModal(); // Performance optimization
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'open-capture-modal') {
        this.openModal();
        sendResponse({ success: true });
      }
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
    modal.className = 'catcher-capture-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'catcher-modal-title');

    modal.innerHTML = `
      <div class="catcher-modal-backdrop">
        <div class="catcher-modal-content">
          <!-- Header -->
          <div class="catcher-modal-header">
            <div class="catcher-icon">🧠</div>
            <h2 id="catcher-modal-title" class="catcher-modal-title">Capture Thought</h2>
            <button class="catcher-close-btn" aria-label="Close modal" title="Close (Esc)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Main Input Area -->
          <div class="catcher-input-container">
            <textarea
              id="catcher-input"
              class="catcher-input"
              placeholder="What's on your mind?"
              rows="4"
              aria-label="Thought input"
            ></textarea>

            <!-- Voice Controls -->
            <div class="catcher-voice-controls">
              <button
                id="catcher-mic-btn"
                class="catcher-mic-btn"
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
              <div id="catcher-transcription" class="catcher-transcription">
                <div class="transcription-text" aria-live="polite"></div>
                <div class="transcription-confidence">
                  <div class="confidence-dots"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="catcher-actions">
            <div class="action-hints">
              <kbd>Cmd</kbd>+<kbd>Enter</kbd> to save • <kbd>Space</kbd> to record • <kbd>Esc</kbd> to close
            </div>
            <button id="catcher-save-btn" class="catcher-save-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 6L9 17L4 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Capture Thought
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupModalEvents(modal);
    return modal;
  }

  openModal() {
    if (this.isOpen) return;

    // Performance optimization: Use pre-created template
    this.modal = this.modalTemplate.cloneNode(true);
    this.setupModalEvents(this.modal);

    // Append to DOM and animate in
    document.body.appendChild(this.modal);

    // Force reflow for smooth animation
    requestAnimationFrame(() => {
      this.modal.classList.add('catcher-modal-open');
      this.focusInput();
    });

    this.isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (!this.isOpen || !this.modal) return;

    // Stop any active recording
    if (this.isRecording) {
      this.stopRecording();
    }

    // Animate out
    this.modal.classList.remove('catcher-modal-open');

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
    modal.querySelector('.catcher-close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    // Backdrop click
    modal.querySelector('.catcher-modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    // Save button
    modal.querySelector('.catcher-save-btn').addEventListener('click', () => {
      this.saveThought();
    });

    // Microphone button
    modal.querySelector('.catcher-mic-btn').addEventListener('click', () => {
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
      if (e.key === ' ' && e.target !== modal.querySelector('.catcher-input')) {
        e.preventDefault();
        this.toggleRecording();
      }

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
      }
    });

    // Auto-resize textarea
    const textarea = modal.querySelector('.catcher-input');
    textarea.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    });
  }

  focusInput() {
    const input = this.modal.querySelector('.catcher-input');
    if (input) {
      input.focus();
      input.select();
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
      // Request microphone permission
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
        };

        this.recognition.onresult = (event) => {
          this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.stopRecording();
        };

        this.recognition.onend = () => {
          this.isRecording = false;
          this.updateRecordingUI(false);
        };

        this.recognition.start();
      } else {
        throw new Error('Speech recognition not supported');
      }

      // Stop the stream (we only needed it for permission)
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.showToast('Microphone access denied', 'error');
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.updateRecordingUI(false);
  }

  handleSpeechResult(event) {
    const textarea = this.modal.querySelector('.catcher-input');
    const transcriptionEl = this.modal.querySelector('.transcription-text');
    const confidenceEl = this.modal.querySelector('.confidence-dots');

    let finalTranscript = textarea.value;
    let interimTranscript = '';

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

    textarea.value = finalTranscript;
    transcriptionEl.textContent = interimTranscript;

    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  updateRecordingUI(isRecording) {
    const micBtn = this.modal.querySelector('.catcher-mic-btn');
    const transcriptionEl = this.modal.querySelector('.catcher-transcription');

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

  async saveThought() {
    const textarea = this.modal.querySelector('.catcher-input');
    const text = textarea.value.trim();

    if (!text) {
      this.showToast('Please enter a thought to capture', 'warning');
      return;
    }

    try {
      // Send to background script
      await chrome.runtime.sendMessage({
        action: 'save-thought',
        data: {
          text,
          timestamp: Date.now(),
          method: this.isRecording ? 'voice' : 'text'
        }
      });

      this.showToast('Thought captured! ✨', 'success');

      // Close modal after short delay
      setTimeout(() => {
        this.closeModal();
      }, 1000);

    } catch (error) {
      console.error('Failed to save thought:', error);
      this.showToast('Failed to save thought. Try again?', 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `catcher-toast catcher-toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize content script
if (window.top === window) {
  new CatcherContentScript();
}
```

---

## 🎨 Orange Theme Styles (content-styles.css)

### Modal Styling with Glassmorphism
```css
/* Catcher Extension Modal Styles */
/* Performance optimized for <100ms appearance */

.catcher-capture-modal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;

  /* Performance optimizations */
  will-change: opacity, transform;
  transform: translateZ(0);

  /* Initial state - hidden */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  /* Smooth transition */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Font override */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif !important;
}

.catcher-modal-open {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: all !important;
}

/* Backdrop with orange-tinted blur */
.catcher-modal-backdrop {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Main modal content */
.catcher-modal-content {
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 106, 0, 0.3);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;

  /* Glass morphism effect */
  backdrop-filter: blur(40px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 106, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  /* Animation */
  transform: scale(0.95) translateY(20px);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.catcher-modal-open .catcher-modal-content {
  transform: scale(1) translateY(0);
}

/* Header */
.catcher-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.catcher-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  background: rgba(255, 106, 0, 0.15);
  border: 1px solid rgba(255, 106, 0, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.catcher-modal-title {
  flex: 1;
  color: #F5F5F5 !important;
  font-size: 24px !important;
  font-weight: 600 !important;
  margin: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;
}

.catcher-close-btn {
  background: none !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.6) !important;
  cursor: pointer !important;
  padding: 8px !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.catcher-close-btn:hover {
  color: rgba(255, 255, 255, 0.8) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Input Container */
.catcher-input-container {
  position: relative;
  margin-bottom: 24px;
}

.catcher-input {
  width: 100% !important;
  min-height: 120px !important;
  max-height: 300px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 16px !important;
  padding: 20px !important;
  color: #F5F5F5 !important;
  font-size: 16px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;
  line-height: 1.6 !important;
  resize: none !important;
  outline: none !important;
  transition: all 0.3s ease !important;
  box-sizing: border-box !important;
}

.catcher-input:focus {
  border-color: rgba(255, 106, 0, 0.5) !important;
  background: rgba(255, 255, 255, 0.12) !important;
  box-shadow:
    0 0 0 3px rgba(255, 106, 0, 0.1) !important,
    0 4px 12px rgba(255, 106, 0, 0.15) !important;
}

.catcher-input::placeholder {
  color: rgba(255, 255, 255, 0.4) !important;
  font-style: italic !important;
}

/* Voice Controls */
.catcher-voice-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.catcher-mic-btn {
  background: rgba(255, 106, 0, 0.15) !important;
  border: 1px solid rgba(255, 106, 0, 0.3) !important;
  border-radius: 50% !important;
  width: 48px !important;
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  color: #FF6A00 !important;
}

.catcher-mic-btn:hover {
  background: rgba(255, 106, 0, 0.25) !important;
  border-color: rgba(255, 106, 0, 0.5) !important;
  transform: scale(1.05) !important;
}

.catcher-mic-btn.recording {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #EF4444 !important;
  animation: recording-pulse 1.5s infinite !important;
}

@keyframes recording-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

/* Transcription Display */
.catcher-transcription {
  flex: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.catcher-transcription.active {
  opacity: 1;
}

.transcription-text {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 14px !important;
  font-style: italic !important;
  margin-bottom: 4px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;
}

.confidence-dots {
  color: #FF6A00 !important;
  font-size: 12px !important;
  letter-spacing: 2px !important;
  font-family: monospace !important;
}

/* Actions */
.catcher-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.action-hints {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 12px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;
}

.action-hints kbd {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 4px !important;
  padding: 2px 6px !important;
  font-size: 11px !important;
  font-family: monospace !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.catcher-save-btn {
  background: linear-gradient(135deg, #FF6A00, #FF8A33) !important;
  border: none !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  color: white !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;

  box-shadow:
    0 4px 16px rgba(255, 106, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.catcher-save-btn:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow:
    0 8px 24px rgba(255, 106, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

.catcher-save-btn:active {
  transform: translateY(-1px) scale(0.98) !important;
  transition: all 0.15s !important;
}

/* Toast Notifications */
.catcher-toast {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  background: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 16px 24px !important;
  color: #F5F5F5 !important;
  font-size: 14px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;
  backdrop-filter: blur(20px) !important;
  z-index: 2147483648 !important;

  transform: translateX(100%) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.catcher-toast.show {
  transform: translateX(0) !important;
}

.catcher-toast-success {
  border-color: rgba(34, 197, 94, 0.5) !important;
  background: rgba(21, 128, 61, 0.2) !important;
}

.catcher-toast-error {
  border-color: rgba(239, 68, 68, 0.5) !important;
  background: rgba(153, 27, 27, 0.2) !important;
}

.catcher-toast-warning {
  border-color: rgba(245, 158, 11, 0.5) !important;
  background: rgba(146, 64, 14, 0.2) !important;
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .catcher-modal-content {
    padding: 24px !important;
    border-radius: 16px !important;
  }

  .catcher-modal-title {
    font-size: 20px !important;
  }

  .catcher-input {
    padding: 16px !important;
    font-size: 16px !important; /* Prevent zoom on iOS */
  }

  .action-hints {
    font-size: 10px !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .catcher-modal-content {
    border-color: #FF8800 !important;
    background: rgba(0, 0, 0, 0.98) !important;
  }

  .catcher-input {
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  .catcher-input:focus {
    border-color: #FF8800 !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .catcher-capture-modal,
  .catcher-modal-content,
  .catcher-save-btn,
  .catcher-toast {
    transition: none !important;
    animation: none !important;
  }

  .recording-pulse {
    animation: none !important;
  }
}
```

---

## 🧰 Storage Management (lib/storage.js)

### IndexedDB Wrapper
```javascript
// Offline-first storage with sync capabilities

export class StorageManager {
  constructor() {
    this.dbName = 'CatcherExtension';
    this.dbVersion = 1;
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Thoughts store
        if (!db.objectStoreNames.contains('thoughts')) {
          const thoughtsStore = db.createObjectStore('thoughts', { keyPath: 'id' });
          thoughtsStore.createIndex('timestamp', 'timestamp');
          thoughtsStore.createIndex('synced', 'synced');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('retryCount', 'retryCount');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveThought(thought) {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['thoughts'], 'readwrite');
    const store = transaction.objectStore('thoughts');

    return new Promise((resolve, reject) => {
      const request = store.add(thought);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentThoughts(limit = 10) {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['thoughts'], 'readonly');
    const store = transaction.objectStore('thoughts');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const thoughts = [];
      const request = index.openCursor(null, 'prev');

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && thoughts.length < limit) {
          thoughts.push(cursor.value);
          cursor.continue();
        } else {
          resolve(thoughts);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(thought) {
    await this.ensureDatabase();

    const syncItem = {
      ...thought,
      retryCount: 0,
      lastRetry: null
    };

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.add(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncItems() {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncItem(id) {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings() {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');

    const settings = {};

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          settings[cursor.value.key] = cursor.value.value;
          cursor.continue();
        } else {
          resolve(settings);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async setSettings(newSettings) {
    await this.ensureDatabase();

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    const promises = Object.entries(newSettings).map(([key, value]) => {
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }

  async ensureDatabase() {
    if (!this.db) {
      await this.initDatabase();
    }
  }
}
```

---

## 📦 Development & Testing

### Local Development Setup
```bash
# 1. Build extension assets
npm run build:extension

# 2. Load unpacked extension in Chrome
# Open chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked" and select extension/ folder

# 3. Test global shortcut
# Press Cmd+K on any webpage
# Modal should appear in <100ms

# 4. Test offline functionality
# Disable network in DevTools
# Capture thoughts - should save locally
# Re-enable network - should auto-sync
```

### Extension Debugging
```javascript
// Debug service worker
console.log('🧠 Checking service worker');
chrome.runtime.getBackgroundPage((page) => {
  console.log('Background page:', page);
});

// Debug storage
chrome.storage.local.get(null, (data) => {
  console.log('Extension storage:', data);
});

// Debug permissions
chrome.permissions.getAll((permissions) => {
  console.log('Current permissions:', permissions);
});
```

### Performance Testing
```javascript
// Measure modal appearance time
const startTime = performance.now();
// Trigger modal open
const endTime = performance.now();
console.log(`Modal appearance: ${endTime - startTime}ms`);
// Target: <100ms

// Memory usage monitoring
const checkMemory = () => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }
};
```

---

*🔌 This Chrome extension provides instant global thought capture with orange-themed glassmorphism design, Apple system fonts, and sub-100ms performance. The offline-first architecture ensures zero friction while maintaining sync capabilities.*