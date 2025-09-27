# CATHCR Chrome Extension Installation Guide

## Quick Installation (Development Build)

The CATHCR Chrome Extension v1.0.0 is ready for installation. Follow these steps to install the development build:

### Step 1: Download Extension Package
- Extension package location: `extension/dist/cathcr-extension-v1.0.0.zip`
- Extract the zip file to a local folder (e.g., `cathcr-extension/`)

### Step 2: Enable Developer Mode
1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle "Developer mode" in the top-right corner
3. You should see new buttons appear: "Load unpacked", "Pack extension", "Update"

### Step 3: Load Extension
1. Click "Load unpacked"
2. Navigate to and select the extracted extension folder
3. The CATHCR extension should appear in your extensions list

### Step 4: Verify Installation
- Extension icon should appear in Chrome toolbar
- Right-click the icon → "Options" should open settings page
- Check that version shows as "1.0.0"

## Extension Features

### Global Shortcuts
- **Ctrl+Shift+C** (Windows/Linux) or **Cmd+K** (Mac): Open capture modal
- Works on any webpage when extension is active

### Popup Interface
- Click extension icon to open quick capture interface
- Voice recording with waveform visualization
- Real-time transcription and processing

### Settings & Options
- Right-click extension icon → "Options"
- Configure account linking with CATHCR platform
- Manage offline sync and notification preferences

## Troubleshooting

### Extension Won't Load
- Ensure you extracted the zip file completely
- Check that manifest.json is present in the selected folder
- Verify Chrome is updated to latest version

### Global Shortcuts Not Working
- Check if other extensions are using the same shortcuts
- Verify extension has necessary permissions
- Try refreshing the page and testing again

### Connection Issues
- Ensure CATHCR web app is accessible at https://cathcr.vercel.app
- Check internet connection for sync functionality
- Verify account linking in extension options

## File Structure
```
cathcr-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── icons/                 # Extension icons (16px, 48px, 128px)
├── src/
│   ├── popup/
│   │   └── index.html     # Popup interface
│   ├── options/
│   │   └── index.html     # Settings page
│   └── content/
│       └── styles.css     # Content script styles
├── assets/                # Compiled JavaScript and CSS
└── service-worker-loader.js # Background service worker
```

## Chrome Web Store Version
Once the extension is published to the Chrome Web Store, installation will be simplified:
1. Visit Chrome Web Store
2. Search for "CATHCR"
3. Click "Add to Chrome"
4. Confirm installation

## Security & Permissions
The extension requests minimal permissions:
- **activeTab**: Capture context from current webpage
- **storage**: Store preferences and offline captures
- **notifications**: Notify users of capture status
- **scripting**: Inject capture interface into webpages

All data is encrypted and synced securely with your CATHCR account.

## Support
For issues or questions:
- Check extension options for troubleshooting tips
- Visit https://cathcr.vercel.app for web app access
- Review privacy policy and terms of service