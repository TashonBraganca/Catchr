# 💭 CATHCR - Instant Thought Capture

> **C**apture **A**ll **T**houghts **H**ere **C**ompletely **R**eliably

CATHCR is an AI-powered thought capture and organization platform that transforms fleeting thoughts into organized, actionable insights. Built with modern web technologies and a focus on seamless user experience across all devices.

[![Development Status](https://img.shields.io/badge/Status-Phase%204%20Complete-brightgreen)](./docs/MVP.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)
[![Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-orange)](./extension/)

## ✨ Features

### 🎯 **Core Capture Experience**
- **Instant Thought Capture**: Global keyboard shortcuts (`Cmd+K`, `Ctrl+Shift+C`) for immediate thought recording
- **Voice Transcription**: Advanced speech-to-text with HuggingFace Whisper and fallback chain
- **Smart Context Awareness**: Automatically captures page context, URL, and metadata
- **Offline-First Architecture**: Seamless sync when connection returns

### 🤖 **AI-Powered Intelligence**
- **GPT-4o Integration**: Advanced thought categorization and insight generation
- **Multi-Model Transcription**: HuggingFace Whisper → OpenAI → WebSpeech fallback chain
- **Smart Organization**: Automatic tagging, categorization, and reminder extraction
- **WCAG AAA Compliance**: Accessible AI with verified color contrast ratios

### 🌐 **Cross-Platform Ecosystem**
- **Modern Web App**: React 18 with glassmorphism design and Apple system fonts
- **Chrome Extension**: Manifest V3 with CRXJS hot reloading and TypeScript
- **Real-time Sync**: Instant synchronization across all devices and platforms
- **Progressive Enhancement**: Works on any device with graceful degradation

### 🎨 **Premium Design System**
- **Apple System Fonts**: SF Pro Text, SF Pro Display, and SF Compact Rounded
- **Glassmorphism UI**: Translucent surfaces with backdrop-blur effects
- **WCAG Compliance**: Orange theme with verified AA/AAA accessibility standards
- **Responsive Design**: Optimized for desktop, tablet, and mobile experiences

## 🏗️ Architecture

CATHCR is built as a modern monorepo with npm workspaces:

```
cathcr/
├── client/          # React 18 frontend with TypeScript
├── server/          # Node.js/Express backend with AI services
├── extension/       # Chrome Extension with CRXJS and Manifest V3
├── shared/          # Common TypeScript types and utilities
└── docs/           # Comprehensive documentation
```

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Modern web application |
| **Backend** | Node.js + Express + TypeScript | API and AI processing |
| **Extension** | Chrome Manifest V3 + CRXJS | Browser integration |
| **Database** | Supabase (PostgreSQL) | Data storage and real-time sync |
| **AI Services** | OpenAI GPT-4o + HuggingFace Whisper | Intelligence and transcription |
| **Styling** | Tailwind CSS + Custom Design System | Premium glassmorphism UI |
| **Build Tools** | Vite + CRXJS + TypeScript | Modern development workflow |

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm 9+**
- **Supabase account** for database and authentication
- **OpenAI API key** for AI processing
- **HuggingFace API token** for transcription services

### 1. Clone and Install
```bash
git clone https://github.com/TashonBraganca/Catchr.git
cd Catchr
npm install
```

### 2. Environment Setup
```bash
# Server configuration
cp server/.env.example server/.env
# Configure: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, HUGGINGFACE_TOKEN

# Client configuration
cp client/.env.example client/.env
# Configure: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 3. Database Setup
```bash
# Apply schema to your Supabase project
# 1. Run server/supabase-schema.sql in Supabase SQL Editor
# 2. Run server/extension-schema.sql for extension support
```

### 4. Start Development
```bash
# Start all services
npm run dev

# Individual services
npm run dev:client    # http://localhost:3000
npm run dev:server    # http://localhost:3001
npm run dev:extension # Extension development
```

## 📱 Chrome Extension

The CATHCR Chrome Extension provides seamless thought capture directly from any webpage:

### **Extension Features**
- **Global Shortcuts**: `Cmd+K` (Mac) or `Ctrl+Shift+C` (Windows/Linux)
- **Context Capture**: Automatically includes page URL, title, and selected text
- **Voice Recording**: Built-in audio transcription with waveform visualization
- **Offline Sync**: Queues captures when offline, syncs automatically when online
- **Account Linking**: Secure connection to main CATHCR account via generated codes

### **Extension Development**
```bash
cd extension
npm install
npm run dev      # Development with hot reloading
npm run build    # Production build for Chrome Web Store
```

## 🤖 AI Integration

CATHCR features a sophisticated AI processing pipeline:

### **Transcription Chain**
1. **HuggingFace Whisper** (openai/whisper-large-v3) - Primary transcription
2. **OpenAI Whisper API** - Fallback for complex audio
3. **WebSpeech API** - Real-time browser transcription

### **Intelligence Features**
- **Smart Categorization**: GPT-4o analyzes and categorizes thoughts automatically
- **Insight Generation**: Discovers patterns and connections between thoughts
- **Reminder Extraction**: Natural language parsing for time-based reminders
- **Confidence Scoring**: All AI operations include confidence metrics

### **Accessibility & Performance**
- **WCAG Compliance**: All AI-generated content meets accessibility standards
- **Fallback Systems**: Graceful degradation when AI services are unavailable
- **Rate Limiting**: Intelligent queuing and throttling for API calls
- **Error Handling**: Comprehensive error recovery and user feedback

## 📊 Development Phases

CATHCR follows a structured 7-phase development approach:

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Design System & Foundation |
| **Phase 2** | ✅ Complete | Core Layout & Navigation |
| **Phase 3** | ✅ Complete | Authentication & User Flow |
| **Phase 4** | ✅ Complete | Integration & Launch Preparation |
| **Phase 5** | 🚧 Planning | Advanced AI Intelligence ("ULTRATHINK") |
| **Phase 6** | ⏳ Future | Mobile Apps & Advanced Features |
| **Phase 7** | ⏳ Future | Enterprise & Collaboration |

**Current Status**: Phase 4 complete with modern extension architecture, AI services integration, and production-ready infrastructure.

## 🛠️ Development Commands

### **Workspace Commands**
```bash
# Install all dependencies
npm install

# Development (all services)
npm run dev

# Individual service development
npm run dev:client
npm run dev:server
npm run dev:extension

# Production builds
npm run build
npm run build:client
npm run build:server
npm run build:extension

# Code quality
npm run lint
npm run lint:fix
npm run typecheck
npm run format

# Testing
npm run test
npm run test:client
npm run test:server
npm run test:extension
```

### **Extension-Specific Commands**
```bash
cd extension

# Development with hot reloading
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint:fix
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**Development Guide**](./docs/DEVELOPMENT.md) | Comprehensive development setup and workflows |
| [**API Documentation**](./docs/API.md) | Complete REST API and WebSocket documentation |
| [**Extension Guide**](./docs/EXTENSION.md) | Chrome extension development and deployment |
| [**AI Integration**](./docs/AI.md) | AI services, models, and processing pipeline |
| [**Design System**](./docs/DESIGN.md) | Typography, colors, components, and accessibility |
| [**Deployment Guide**](./docs/DEPLOYMENT.md) | Production deployment and configuration |

## 🔒 Security & Privacy

- **End-to-End Encryption**: All sensitive data encrypted in transit and at rest
- **Row-Level Security**: Database-level access control with Supabase RLS
- **GDPR Compliance**: Full data export, deletion, and privacy controls
- **Secure Authentication**: JWT tokens with proper rotation and validation
- **Extension Security**: Manifest V3 with minimal permissions and CSP
- **API Rate Limiting**: Comprehensive protection against abuse

## 🚀 Deployment

### **Production Requirements**
- **Node.js 18+** runtime environment
- **PostgreSQL 14+** database (Supabase recommended)
- **Redis** for session management and caching (optional)
- **SSL/TLS** certificates for secure connections

### **Environment Variables**
```bash
# Required for server
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
HUGGINGFACE_TOKEN=your-hf-token

# Required for client
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Build and Deploy**
```bash
# Build all packages for production
npm run build

# Start production server
npm start

# Deploy extension to Chrome Web Store
cd extension && npm run build
# Upload dist/ folder to Chrome Web Store
```

## 🤝 Contributing

1. **Fork the repository** and create a feature branch
2. **Follow the coding standards** defined in `.eslintrc.js` and `.prettierrc`
3. **Write TypeScript** with proper types and documentation
4. **Test thoroughly** across all supported platforms
5. **Submit a pull request** with clear description of changes

### **Code Quality Standards**
- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: Configured for React, Node.js, and Chrome extensions
- **Prettier**: Consistent code formatting across all packages
- **Testing**: Unit tests for utilities, integration tests for APIs
- **Accessibility**: WCAG AA compliance minimum, AAA preferred

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o and Whisper API services
- **HuggingFace** for open-source Whisper models
- **Supabase** for database and authentication infrastructure
- **Vercel** for deployment and hosting solutions
- **The React Team** for the amazing React 18 features
- **Chrome Extensions Team** for Manifest V3 and modern APIs

---

<div align="center">
  <strong>Built with ❤️ for thoughtful minds everywhere</strong>
  <br>
  <sub>CATHCR - Where every thought finds its place</sub>
</div>