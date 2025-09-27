# Chrome Web Store Publishing Guide

## Overview
This guide covers the process of publishing the CATHCR Chrome Extension to the Chrome Web Store.

## Prerequisites

### Developer Account
- Chrome Web Store Developer account ($5 one-time registration fee)
- Account verification complete
- Payment methods configured for any paid features

### Extension Assets Required
- Extension build files (generated via `npm run build` in extension directory)
- High-quality screenshots (1280x800 or 640x400 pixels)
- Store listing images:
  - Small tile: 440x280 pixels
  - Large tile: 920x680 pixels
  - Marquee: 1400x560 pixels

## Automated Build Process

### GitHub Actions Release
The repository includes automated release workflows:

1. **Trigger Release**:
   ```bash
   # Create and push a version tag
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Manual Release**:
   - Go to GitHub Actions
   - Run "Chrome Extension Release" workflow
   - Specify version number

3. **Download Build**:
   - Extension zip file available in GitHub Releases
   - Pre-built and tested via CI/CD pipeline

## Manual Publication Steps

### 1. Prepare Extension Package
```bash
cd extension
npm run build
cd dist
zip -r cathcr-extension.zip .
```

### 2. Chrome Web Store Console
1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "Add new item"
3. Upload the extension zip file

### 3. Store Listing Information

#### Basic Information
- **Name**: CATHCR - Instant Thought Capture
- **Summary**: AI-powered thought capture with global shortcuts and voice transcription
- **Description**:
```
Transform fleeting thoughts into organized, actionable insights with CATHCR's intelligent capture system.

🎯 KEY FEATURES
• Global keyboard shortcuts (Cmd+K, Ctrl+Shift+C) for instant capture
• Advanced voice transcription with HuggingFace Whisper
• Real-time sync across all devices
• Offline-first architecture with automatic sync
• Smart context awareness (page URL, title, selected text)

🤖 AI-POWERED INTELLIGENCE
• GPT-4o integration for thought categorization
• Automatic insight generation and pattern recognition
• Natural language reminder extraction
• Confidence scoring for all AI operations

🌐 SEAMLESS INTEGRATION
• Works on any webpage with minimal permissions
• Secure connection to CATHCR platform via generated codes
• Queue captures when offline, sync when online
• Built with Manifest V3 for future compatibility

Perfect for researchers, writers, students, and knowledge workers who need to capture thoughts instantly without losing focus.
```

#### Category & Tags
- **Category**: Productivity
- **Tags**: productivity, note-taking, AI, voice-transcription, thoughts, capture

#### Screenshots & Images
Required images (prepare 3-5 screenshots showing):
1. Extension popup interface
2. Voice recording with waveform
3. Global shortcut activation
4. Sync status and offline mode
5. Options/settings page

### 4. Privacy & Permissions

#### Privacy Policy
Link to: `https://cathcr.vercel.app/privacy`

#### Permissions Justification
- **activeTab**: Capture context from current webpage
- **storage**: Store user preferences and offline captures
- **notifications**: Notify users of capture status
- **scripting**: Inject capture interface into webpages

#### Data Usage
- All data encrypted in transit and at rest
- No personal information collected without consent
- User controls all data export and deletion
- GDPR compliant with full user data rights

### 5. Distribution Settings
- **Visibility**: Public
- **Regions**: All regions where legally permitted
- **Pricing**: Free

## Quality Assurance Checklist

### Pre-Submission Testing
- [ ] Extension builds without errors
- [ ] All TypeScript compilation passes
- [ ] Manifest V3 compliance verified
- [ ] Popup loads correctly
- [ ] Options page functions properly
- [ ] Global shortcuts work as expected
- [ ] Voice recording and playback functional
- [ ] Sync with main platform operational
- [ ] Offline mode captures and syncs correctly

### Store Requirements Compliance
- [ ] No prohibited content
- [ ] Privacy policy accessible
- [ ] Permissions minimal and justified
- [ ] Screenshots accurately represent functionality
- [ ] Description clear and accurate
- [ ] No trademark violations
- [ ] Code obfuscation avoided

## Post-Publication

### Monitoring
- Track extension analytics in Chrome Web Store Console
- Monitor user reviews and ratings
- Watch for policy violations or warnings

### Updates
- Use GitHub Actions for automated release creation
- Upload new versions through Web Store Console
- Update store listing as needed for new features

### Support
- Respond to user reviews promptly
- Maintain help documentation
- Provide clear contact information for support

## Automation Summary

| Process | Method | Trigger |
|---------|--------|---------|
| **Build** | GitHub Actions | Tag push or manual |
| **Package** | Automated zip creation | Part of build workflow |
| **Test** | CI/CD pipeline | Every commit |
| **Release** | GitHub Releases | Tag creation |
| **Upload** | Manual via Web Store Console | After GitHub release |

## Timeline
- **First submission**: 1-3 days review time
- **Updates**: Usually approved within 24 hours
- **Policy violations**: May require resubmission

The automated pipeline ensures consistent, tested builds ready for Chrome Web Store publication.