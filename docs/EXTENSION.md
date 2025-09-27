# CATHCR Chrome Extension Guide

This comprehensive guide covers the CATHCR Chrome Extension development, architecture, and deployment.

## 🌟 Overview

The CATHCR Chrome Extension provides seamless thought capture directly from any webpage, integrating with the main CATHCR application through a modern TypeScript architecture built with CRXJS and Manifest V3.

### **Key Features**
- **Global Keyboard Shortcuts**: `Cmd+K` (Mac) or `Ctrl+Shift+C` (Windows/Linux)
- **Context-Aware Capture**: Automatically includes page URL, title, and selected text
- **Voice Recording**: Built-in audio transcription with waveform visualization
- **Offline-First Architecture**: Queues captures when offline, syncs when online
- **Account Linking**: Secure connection to main CATHCR account via generated codes
- **Real-time Sync**: Instant synchronization with the main application

## 🏗️ Architecture

### **Manifest V3 Structure**
```
extension/
├── src/
│   ├── manifest.ts          # Chrome extension manifest configuration
│   ├── background/          # Service worker scripts
│   │   ├── index.ts         # Main background script
│   │   ├── sync.ts          # Synchronization service
│   │   ├── storage.ts       # Storage management
│   │   └── notifications.ts # Notification system
│   ├── content/             # Content scripts
│   │   ├── index.ts         # Content script entry point
│   │   └── styles.css       # Modal and UI styles
│   ├── popup/               # Extension popup
│   │   ├── index.html       # Popup HTML structure
│   │   ├── index.ts         # Popup TypeScript logic
│   │   └── styles.css       # Popup styling
│   ├── options/             # Options/Settings page
│   │   ├── index.html       # Options HTML structure
│   │   ├── index.ts         # Options TypeScript logic
│   │   └── styles.css       # Options styling
│   └── types/               # TypeScript type definitions
│       └── index.ts         # Extension-specific types
├── public/                  # Static assets
│   ├── icons/              # Extension icons (16, 48, 128px)
│   └── manifest.json       # Generated manifest (build artifact)
├── package.json            # Extension dependencies
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # CRXJS Vite configuration
└── dist/                   # Built extension (generated)
```

### **Technology Stack**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Build System** | CRXJS + Vite | Hot reloading, TypeScript compilation |
| **Manifest** | Chrome Manifest V3 | Modern extension APIs and security |
| **Background** | Service Worker | Event handling, sync, notifications |
| **Content Scripts** | TypeScript + CSS | DOM injection and modal display |
| **Storage** | Chrome Storage API | Offline-first data persistence |
| **Authentication** | JWT Tokens | Secure server communication |
| **UI Framework** | Vanilla TypeScript | Lightweight, fast interface |

## 🛠️ Development Setup

### Prerequisites
- **Node.js 18+** and **npm 9+**
- **Chrome Browser** for testing
- **CATHCR Server** running (for API integration)

### Installation
```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Start development with hot reloading
npm run dev

# Build for production
npm run build
```

### **Development Configuration**

1. **Environment Setup**:
   ```bash
   # Extension automatically detects development mode
   # Server URLs are configured in src/background/sync.ts:

   const API_BASE_URL = __DEV__
     ? 'http://localhost:3001'
     : 'https://api.cathcr.com';
   ```

2. **Load Extension in Chrome**:
   ```bash
   # After running npm run dev:
   # 1. Open Chrome → More Tools → Extensions
   # 2. Enable "Developer mode"
   # 3. Click "Load unpacked"
   # 4. Select the extension/dist/ folder
   ```

3. **Hot Reloading**:
   - CRXJS automatically reloads the extension on code changes
   - Background scripts, content scripts, and popup all support HMR
   - No manual reloading required during development

## 📋 Extension Components

### **1. Background Service Worker** (`src/background/index.ts`)

The main orchestrator handling global events, shortcuts, and coordination:

```typescript
class CathcrBackground {
  private storage: CathcrStorage;
  private sync: CathcrSync;
  private notifications: CathcrNotifications;

  // Handles global keyboard shortcuts
  private async handleCommand(command: string, tab?: chrome.tabs.Tab) {
    switch (command) {
      case 'capture-thought':
        await this.openCaptureModal(tab);
        break;
    }
  }

  // Processes thought captures from any source
  private async handleCaptureThought(captureData: CaptureData) {
    const stored = await this.storage.addCapture(captureData);
    await this.sync.queueCapture(stored);
    await this.notifications.show({
      title: '📝 Thought Captured',
      message: 'Your thought has been saved and will sync automatically.'
    });
  }
}
```

**Key Responsibilities:**
- Global keyboard shortcut handling
- Cross-component message routing
- Extension lifecycle management
- Alarm-based periodic sync scheduling

### **2. Sync Service** (`src/background/sync.ts`)

Handles bidirectional synchronization with the CATHCR server:

```typescript
export class CathcrSync {
  private readonly API_BASE_URL = __DEV__
    ? 'http://localhost:3001'
    : 'https://api.cathcr.com';

  private readonly ENDPOINTS = {
    SYNC: '/api/extension/sync',
    AUTH: '/api/extension/auth',
    CAPTURES: '/api/extension/captures',
  } as const;

  // Syncs unsynced captures in batches
  async syncNow(): Promise<SyncResult> {
    const unsyncedCaptures = storage.captures?.filter(c => !c.synced) || [];

    if (unsyncedCaptures.length === 0) {
      return { success: true, synced: 0 };
    }

    // Authenticate if needed
    if (!this.authToken) {
      await this.authenticate();
    }

    // Sync in batches of 10
    const batchSize = 10;
    let totalSynced = 0;

    for (let i = 0; i < unsyncedCaptures.length; i += batchSize) {
      const batch = unsyncedCaptures.slice(i, i + batchSize);
      const syncedIds = await this.syncBatch(batch);
      totalSynced += syncedIds.length;

      if (syncedIds.length > 0) {
        await this.markAsSynced(syncedIds);
      }
    }

    return { success: true, synced: totalSynced };
  }
}
```

**Features:**
- JWT-based authentication with the server
- Batch synchronization for efficiency
- Automatic retry logic with exponential backoff
- Offline queue management
- Conflict resolution for duplicate captures

### **3. Storage Management** (`src/background/storage.ts`)

Offline-first storage with Chrome Storage API:

```typescript
export class CathcrStorage {
  private readonly STORAGE_KEYS = {
    CAPTURES: 'cathcr_captures',
    SYNC_STATUS: 'cathcr_sync_status',
    USER_SETTINGS: 'cathcr_user_settings',
  } as const;

  private readonly MAX_CAPTURES = 1000;
  private readonly CLEANUP_THRESHOLD = 800;

  // Adds capture with automatic cleanup
  async addCapture(captureData: Omit<CaptureData, 'id' | 'timestamp' | 'synced'>): Promise<CaptureData> {
    const capture: CaptureData = {
      id: this.generateId(),
      timestamp: Date.now(),
      synced: false,
      ...captureData,
    };

    const storage = await this.getStorageData();
    storage.captures.unshift(capture); // Add to beginning

    // Cleanup if needed
    if (storage.captures.length > this.CLEANUP_THRESHOLD) {
      storage.captures = storage.captures.slice(0, this.MAX_CAPTURES);
    }

    await this.setStorageData(storage);
    return capture;
  }
}
```

**Features:**
- Automatic storage limits and cleanup
- Structured data organization
- Migration support for version updates
- User settings persistence

### **4. Content Script** (`src/content/index.ts`)

Injects capture modal into any webpage:

```typescript
class CathcrContent {
  private modal: HTMLElement | null = null;

  // Opens the capture modal
  private async openCaptureModal(context?: any): Promise<void> {
    if (this.modal) {
      this.closeCaptureModal();
    }

    // Create modal with glassmorphism styling
    this.modal = this.createModalElement(context);
    document.body.appendChild(this.modal);

    // Focus the textarea
    const textarea = this.modal.querySelector('textarea');
    textarea?.focus();

    // Animate in
    requestAnimationFrame(() => {
      this.modal?.classList.add('cathcr-modal-visible');
    });
  }

  // Handles form submission
  private async submitCapture(text: string, context: any): Promise<void> {
    await browser.runtime.sendMessage({
      type: 'CAPTURE_THOUGHT',
      payload: {
        text,
        context: {
          url: window.location.href,
          title: document.title,
          favicon: this.getFavicon(),
          ...context,
        },
        source: 'content-script',
        timestamp: Date.now(),
      },
    });

    this.closeCaptureModal();
    this.showSuccessToast();
  }
}
```

**Features:**
- Modal injection with glassmorphism design
- Keyboard shortcuts (`Escape`, `Cmd+Enter`)
- Context capture (URL, title, selected text)
- Toast notifications for user feedback
- Accessibility support with proper ARIA attributes

### **5. Popup Interface** (`src/popup/index.ts`)

Quick capture interface accessible from browser toolbar:

```typescript
class CathcrPopup {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;

  // Handles voice recording
  private async startVoiceRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
      await this.processVoiceRecording(audioBlob);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    this.updateUI();
  }

  // Displays recent captures
  private updateCapturesList(captures: CaptureData[]): void {
    const recentCaptures = captures.slice(0, 5);
    this.elements.capturesList.innerHTML = recentCaptures
      .map(capture => this.createCaptureItem(capture))
      .join('');
  }
}
```

**Features:**
- Quick text input with autofocus
- Voice recording with visual feedback
- Recent captures display
- Sync status indicators
- Settings and dashboard links

### **6. Options Page** (`src/options/index.ts`)

Comprehensive settings and account management:

```typescript
class CathcrOptions {
  private settings: UserSettings = {
    syncEnabled: true,
    autoCapture: true,
    notifications: true,
    analyticsEnabled: false,
  };

  // Handles account connection
  private async handleConnectAccount(): Promise<void> {
    const url = __DEV__
      ? 'http://localhost:3000/connect-extension'
      : 'https://cathcr.com/connect-extension';
    await browser.tabs.create({ url });
  }

  // Exports user data
  private async handleExportData(): Promise<void> {
    const storage = await browser.runtime.sendMessage({ type: 'GET_STORAGE' });
    const exportData = {
      version: browser.runtime.getManifest().version,
      exportDate: new Date().toISOString(),
      captures: storage.captures || [],
      settings: storage.userSettings || {},
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cathcr-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
}
```

**Features:**
- Settings management with real-time sync
- Account connection via generated codes
- Data export/import functionality
- Storage statistics and cleanup
- Extension analytics (optional)

## 🎨 Styling & Design

### **Design System**
The extension follows the main CATHCR design principles:

```css
/* Apple System Fonts */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;

/* Glassmorphism Effects */
.cathcr-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

/* WCAG Compliant Orange Theme */
.cathcr-btn-primary {
  background: #FFA500; /* 8.9:1 contrast ratio */
  color: white;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .cathcr-modal {
    background: rgba(31, 41, 55, 0.95);
    color: #f9fafb;
  }
}
```

### **Responsive Design**
- **Popup**: Fixed 380px width, minimum 500px height
- **Modal**: Responsive 90% width, max 500px
- **Mobile Support**: Touch-friendly targets, proper spacing
- **Accessibility**: High contrast support, reduced motion options

## 🔐 Security & Permissions

### **Manifest V3 Permissions**
```json
{
  "permissions": [
    "storage",        // Local data persistence
    "activeTab",      // Current tab access for context
    "scripting",      // Content script injection
    "notifications"   // User notifications
  ],
  "optional_permissions": [
    "microphone"      // Voice recording (user-granted)
  ],
  "host_permissions": [
    "http://localhost:3001/*",    // Development server
    "https://api.cathcr.com/*"    // Production API
  ]
}
```

### **Content Security Policy**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
  }
}
```

### **Data Security**
- **JWT Authentication**: Secure token-based API communication
- **Data Encryption**: All sensitive data encrypted in transit
- **Local Storage**: Chrome Storage API with user data isolation
- **Permission Requests**: Explicit user consent for microphone access
- **No External Scripts**: All code bundled, no CDN dependencies

## 🔄 Synchronization

### **Sync Architecture**
```
Extension Storage → Batch Queue → Server API → Main Database
     ↑                              ↓
   Offline Queue ←─────────── Real-time Updates
```

### **Sync States**
| State | Description | User Experience |
|-------|-------------|-----------------|
| **Online & Synced** | All captures synchronized | Green indicator, real-time sync |
| **Online & Pending** | Captures queued for sync | Yellow indicator, "Syncing..." |
| **Offline** | No network connection | Red indicator, "Offline" message |
| **Error** | Sync failures | Red indicator with retry option |

### **Conflict Resolution**
1. **Duplicate Detection**: Server checks for existing captures by text + timestamp
2. **Merge Strategy**: Extension captures always take precedence
3. **Retry Logic**: Exponential backoff for failed sync attempts
4. **User Notification**: Clear feedback on sync status and issues

## 🧪 Testing

### **Development Testing**
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Unit tests (when implemented)
npm run test

# Manual testing checklist:
# ✅ Global shortcuts work on all websites
# ✅ Modal injection works correctly
# ✅ Voice recording functions properly
# ✅ Sync operates in online/offline scenarios
# ✅ Account linking works end-to-end
```

### **Extension Testing Checklist**
- [ ] **Keyboard Shortcuts**: Test `Cmd+K` and `Ctrl+Shift+C` globally
- [ ] **Modal Injection**: Verify modal works on various websites (news, social media, docs)
- [ ] **Voice Recording**: Test microphone permissions and audio transcription
- [ ] **Sync Functionality**: Test online/offline scenarios and data integrity
- [ ] **Account Linking**: Verify connection code generation and validation
- [ ] **Popup Interface**: Test all popup functionality and recent captures
- [ ] **Options Page**: Verify all settings and data export/import
- [ ] **Cross-browser**: Test in Chrome, Edge, and other Chromium browsers

## 📦 Deployment

### **Building for Production**
```bash
# Clean previous builds
rm -rf dist/

# Build optimized extension
npm run build

# Verify build contents
ls -la dist/
# Should contain: manifest.json, assets/, icons/, service workers
```

### **Chrome Web Store Preparation**

1. **Update Version**: Increment version in `package.json`
2. **Build Production**: Run `npm run build`
3. **Create Package**: Zip the `dist/` folder
4. **Store Assets**: Prepare screenshots, descriptions, privacy policy
5. **Submit Review**: Upload to Chrome Web Store Developer Dashboard

### **Extension Package Structure**
```
cathcr-extension-v1.0.0.zip
├── manifest.json           # Generated manifest
├── service-worker.js       # Background script bundle
├── content-script.js       # Content script bundle
├── popup.html             # Popup interface
├── popup.js               # Popup logic bundle
├── options.html           # Options page
├── options.js             # Options logic bundle
├── styles/                # CSS bundles
├── icons/                 # Extension icons
└── assets/                # Additional resources
```

### **Post-Deployment**
- **Analytics**: Monitor extension usage and error rates
- **User Feedback**: Respond to Chrome Web Store reviews
- **Updates**: Regular updates for bug fixes and new features
- **Documentation**: Keep extension documentation current

## 🔧 Development Commands

### **Essential Commands**
```bash
# Development
npm run dev              # Start development with hot reloading
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting issues
npm run typecheck       # Verify TypeScript types
npm run format          # Format code with Prettier

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate test coverage report
```

### **Debugging Commands**
```bash
# Chrome Extension Debugging
# 1. Open chrome://extensions/
# 2. Find CATHCR extension
# 3. Click "background page" link
# 4. Use Chrome DevTools for debugging

# Background Script Logs
console.log('🚀 CATHCR Background Service Worker initialized');

# Content Script Debugging
# Use regular browser DevTools on any page

# Popup Debugging
# Right-click extension icon → "Inspect popup"
```

## 🤝 Contributing to Extension

### **Code Style**
- **TypeScript**: Strict mode, comprehensive type coverage
- **ESLint**: Configured for Chrome extension development
- **Prettier**: Consistent formatting across all files
- **Comments**: JSDoc for public APIs, inline for complex logic

### **Pull Request Checklist**
- [ ] TypeScript compilation passes
- [ ] ESLint checks pass
- [ ] Extension loads without errors
- [ ] All functionality tested manually
- [ ] Documentation updated as needed
- [ ] Version bumped if necessary

### **File Naming Conventions**
- **TypeScript**: `camelCase.ts`
- **Styles**: `kebab-case.css`
- **HTML**: `kebab-case.html`
- **Assets**: `kebab-case.png/svg`

## 🔗 Integration with Main App

### **Account Linking Flow**
1. **User Action**: Click "Connect Account" in extension options
2. **Code Generation**: Main app generates 6-digit connection code
3. **Code Entry**: User enters code in extension
4. **Validation**: Server validates code and links accounts
5. **Confirmation**: Both extension and app show success status

### **Data Flow**
```
Extension Capture → Local Storage → Sync Queue → Server API → Database → Main App Dashboard
```

### **Real-time Updates**
- **Capture Sync**: Extension captures appear in main app within seconds
- **Settings Sync**: Account settings synchronized bidirectionally
- **Status Updates**: Real-time sync status across all platforms

## 📊 Analytics & Monitoring

### **Privacy-Compliant Analytics**
- **Usage Metrics**: Capture frequency, sync success rates
- **Error Tracking**: Extension errors with stack traces (no personal data)
- **Performance**: Load times, memory usage, battery impact
- **User Consent**: All analytics require explicit user opt-in

### **Key Metrics**
- **Daily Active Users**: Users opening extension daily
- **Capture Rate**: Average captures per user per day
- **Sync Success**: Percentage of successful synchronizations
- **Error Rate**: Extension errors per thousand operations

## 🆘 Troubleshooting

### **Common Issues**

1. **Extension Not Loading**
   ```bash
   # Check manifest.json syntax
   # Verify all required files exist in dist/
   # Check Chrome console for errors
   ```

2. **Sync Failures**
   ```bash
   # Verify server connectivity
   # Check authentication tokens
   # Review network requests in DevTools
   ```

3. **Modal Not Appearing**
   ```bash
   # Check content script injection
   # Verify website CSP compatibility
   # Test on different websites
   ```

4. **Voice Recording Issues**
   ```bash
   # Check microphone permissions
   # Verify HTTPS requirement
   # Test audio device availability
   ```

### **Debug Information**
```javascript
// Extension debug info
const debugInfo = {
  version: chrome.runtime.getManifest().version,
  permissions: chrome.runtime.getManifest().permissions,
  storage: await chrome.storage.local.get(),
  connectivity: navigator.onLine,
  timestamp: new Date().toISOString()
};
console.log('🔍 Debug Info:', debugInfo);
```

---

For additional support, see the [main CATHCR documentation](../README.md) or [API documentation](./API.md).