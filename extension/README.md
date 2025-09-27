# CATHCR Chrome Extension

A Chrome extension for instant thought capture with global keyboard shortcuts, voice recognition, and seamless sync with the main CATHCR database.

## Features

🧠 **Instant Capture** - Press Cmd+K (Mac) or Ctrl+Shift+C anywhere to capture thoughts
🎤 **Voice Recognition** - Real-time speech-to-text using Web Speech API
📱 **Orange Glassmorphism** - Beautiful orange-themed modal with Apple system fonts
⚡ **<100ms Modal** - Optimized for zero-friction thought capture
🔄 **Offline-First** - Works offline with automatic sync when online
🎯 **Background Sync** - Automatic synchronization with main CATHCR database

## Installation

### Development
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Pin the extension to your toolbar

### Usage
- **Global Shortcut**: Press `Cmd+K` (Mac) or `Ctrl+Shift+C` (Windows/Linux) on any webpage
- **Voice Input**: Click the microphone button or press `Space` in the modal
- **Text Input**: Type directly in the textarea
- **Save**: Press `Cmd+Enter` or click "Capture Thought"
- **Cancel**: Press `Escape` or click the X button

## Architecture

### Files Structure
```
extension/
├── manifest.json          # Chrome Manifest V3 configuration
├── background.js          # Service worker for shortcuts & sync
├── content-script.js      # Modal injection & UI management
├── content-styles.css     # Orange glassmorphism styles
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
└── icons/                # Extension icons
```

### Key Components

**Service Worker (background.js)**
- Global keyboard shortcut handling
- Offline-first storage management
- Background sync with CATHCR API
- Notification management

**Content Script (content-script.js)**
- Modal injection across all websites
- Real-time voice transcription
- Performance-optimized UI (<100ms)
- Apple system font integration

**Popup Interface**
- Recent thoughts display
- Sync status and statistics
- Manual sync controls
- Connection status indicator

## Technical Details

- **Manifest Version**: 3 (Chrome Extensions V3)
- **Permissions**: `storage`, `activeTab`, `scripting`, `notifications`
- **Optional Permissions**: `microphone` (requested on first voice use)
- **Storage**: Chrome local storage (offline-first)
- **API Integration**: RESTful sync with main CATHCR server
- **Performance**: Sub-100ms modal appearance target

## Development

The extension is built with vanilla JavaScript for maximum performance and minimal bundle size. It uses:

- **Web Speech API** for real-time voice transcription
- **Chrome Extensions API** for storage and messaging
- **CSS3** for glassmorphism effects and animations
- **Apple System Fonts** throughout the interface

## Sync Behavior

1. **Offline Storage**: Thoughts saved locally first
2. **Sync Queue**: Failed syncs queued for retry
3. **Auto Sync**: Every 30 seconds when online
4. **Manual Sync**: Available via popup interface
5. **Retry Logic**: Exponential backoff with max 3 attempts

## Privacy

- No persistent audio storage
- Local-first data approach
- Sync only when user opts in
- No tracking or analytics
- Respects Chrome's privacy settings

## Troubleshooting

**Modal doesn't appear**
- Check if page URL is supported (not chrome://)
- Verify extension is enabled and up-to-date
- Try using the popup as fallback

**Voice recognition not working**
- Grant microphone permissions
- Test on HTTPS sites only
- Check system audio input device

**Sync issues**
- Verify internet connection
- Check API endpoint availability
- Use manual sync from popup

## API Integration

The extension connects to the main CATHCR API at:
- **Development**: `http://localhost:3001`
- **Production**: `https://api.cathcr.com`

Endpoint used: `POST /api/thoughts` with thought data payload.

---

Built with ❤️ for instant thought capture anywhere on the web.