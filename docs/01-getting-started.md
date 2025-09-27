# 🚀 Getting Started with CATHCR

*The ultimate AI-powered thought capture platform with orange-themed glassmorphism design*

## 📋 Quick Start Checklist

- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up Supabase database
- [ ] Configure OpenAI API key
- [ ] Start development servers
- [ ] Install Chrome extension (optional)
- [ ] Test voice capture functionality

---

## 🛠 Prerequisites

Before getting started with CATHCR, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** (for cloning the repository)

### Recommended Tools
- **Visual Studio Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
- **Chrome Browser** (for extension development)
- **Postman** (for API testing)

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cathcr.git
cd cathcr
```

### 2. Install Dependencies
The project uses npm workspaces for monorepo management:

```bash
# Install root dependencies and all workspace packages
npm install

# Verify installation
npm run typecheck
```

### 3. Environment Configuration

#### Server Environment (.env)
Create `server/.env` from the example:
```bash
cp server/.env.example server/.env
```

Configure the following variables:
```env
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key

# OpenAI Configuration (CORRECTED - Use OpenAI not Claude)
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORGANIZATION=your-openai-org-id

# HuggingFace Configuration (for Whisper)
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Server Configuration
NODE_ENV=development
PORT=3001
```

#### Client Environment (.env)
Create `client/.env` from the example:
```bash
cp client/.env.example client/.env
```

Configure the following variables:
```env
# Supabase Configuration (same as server)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Redirect URL
VITE_REDIRECT_URL=http://localhost:3000

# API Configuration
VITE_API_URL=http://localhost:3001
```

---

## 🗄 Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the project URL and API keys to your `.env` files
3. Navigate to the SQL editor in your Supabase dashboard

### 2. Import Database Schema
```bash
# Run the schema from the SQL editor or via CLI
supabase db reset
```

Or copy and paste the contents of `server/supabase-schema.sql` into the Supabase SQL editor.

### 3. Enable Row Level Security (RLS)
The schema automatically sets up RLS policies, but verify:
- All tables have RLS enabled
- Users can only access their own data
- Authentication is properly configured

---

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)
Start both client and server simultaneously:
```bash
npm run dev
```

This will start:
- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
- **Hot reload** enabled for both

### Individual Services
Run services separately for debugging:

```bash
# Start only the frontend
npm run dev:client

# Start only the backend
npm run dev:server
```

### Production Build
```bash
# Build all packages
npm run build

# Start production server
npm start
```

---

## 🎨 Design System Verification

### Typography Test (Apple System Fonts)
Visit `http://localhost:3000` and verify:
- [ ] All text uses Apple system fonts (`-apple-system, BlinkMacSystemFont, "SF Pro Text"`)
- [ ] NO monospace fonts in body text (only for timestamps/labels)
- [ ] Text is crisp and readable across devices

### Orange Theme Test
Verify the orange color palette:
- [ ] **Primary Orange**: #FF6A00 (buttons, CTAs)
- [ ] **Hover Orange**: #FF8A33 (interactive states)
- [ ] **Subtle Orange**: #FFB080 (backgrounds, accents)
- [ ] **AMOLED Black**: #000000 (backgrounds)
- [ ] **WCAG AA Compliance**: All text meets contrast requirements

### Glassmorphism Effects
Check for proper glass morphism:
- [ ] Backdrop blur effects on modals
- [ ] Orange-tinted glass borders
- [ ] Translucent overlays with proper depth

---

## 🎤 Voice Capture Setup

### Web Speech API Test
1. Open the capture modal (Cmd/Ctrl+K)
2. Click the microphone icon
3. Grant microphone permissions when prompted
4. Speak a test phrase
5. Verify real-time transcription appears

### Microphone Permissions
Ensure browser permissions are granted:
- **Chrome**: Settings > Privacy and security > Site Settings > Microphone
- **Firefox**: about:preferences#privacy > Permissions > Microphone
- **Safari**: Preferences > Websites > Microphone

---

## 🔌 Chrome Extension Setup (Optional)

### Install Extension for Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder from the project directory
5. Pin the extension to your toolbar

### Test Global Shortcuts
- Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux)
- The capture modal should appear instantly (<100ms)
- Test voice and text input
- Verify auto-save functionality

---

## ✅ Verification Checklist

### Core Functionality
- [ ] Application loads without errors
- [ ] Voice capture works with real-time transcription
- [ ] Thoughts save to database successfully
- [ ] Search functionality returns results
- [ ] Authentication flow works properly

### Performance Benchmarks
- [ ] **Modal Appearance**: <100ms (CRITICAL)
- [ ] **Animations**: Smooth 60fps throughout
- [ ] **Search Response**: <200ms for results
- [ ] **Transcription Accuracy**: >90% in quiet environments

### Design Compliance
- [ ] Apple system fonts throughout (NO monospace in body text)
- [ ] Orange theme (#FF6A00, #FF8A33, #FFB080) properly applied
- [ ] AMOLED black backgrounds (#000000)
- [ ] Glassmorphism effects working correctly
- [ ] WCAG AA contrast compliance verified

### API Integration
- [ ] OpenAI API responding (NOT Claude API)
- [ ] HuggingFace Whisper integration functional
- [ ] Supabase database connection established
- [ ] All environment variables configured correctly

---

## 🚨 Common Issues & Quick Fixes

### "Module not found" Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check RLS policies are enabled
- Ensure database schema is up to date

### Voice Capture Not Working
- Check microphone permissions in browser
- Test in HTTPS environment (required for Web Speech API)
- Verify audio input device is working

### Font Loading Issues
- Check that Apple system fonts are properly configured
- Clear browser cache and reload
- Verify Tailwind CSS is loading correctly

### API Authentication Errors
- Verify OpenAI API key is valid and has credits
- Check HuggingFace API key permissions
- Ensure environment variables are loaded correctly

---

## 📞 Getting Help

### Documentation Resources
- [02-architecture.md](./02-architecture.md) - System architecture overview
- [03-design-system.md](./03-design-system.md) - Orange theme and components
- [04-extension-guide.md](./04-extension-guide.md) - Chrome extension development
- [08-troubleshooting.md](./08-troubleshooting.md) - Comprehensive troubleshooting

### Community Support
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Join GitHub Discussions for general questions
- **Discord**: Join the community Discord for real-time help

### Development Tools
- **Health Check**: Visit `http://localhost:3001/health` for server status
- **API Documentation**: `http://localhost:3001/docs` (when implemented)
- **Database Console**: Access through Supabase dashboard

---

## 🎯 Next Steps

Once you have the basic setup working:

1. **📖 Study Architecture** - Read [02-architecture.md](./02-architecture.md) to understand the system design
2. **🎨 Explore Design System** - Review [03-design-system.md](./03-design-system.md) for theming guidelines
3. **🔌 Build Extension** - Follow [04-extension-guide.md](./04-extension-guide.md) for Chrome extension development
4. **🤖 Configure AI** - Read [06-ai-integration.md](./06-ai-integration.md) for OpenAI and Whisper setup
5. **🚀 Deploy** - Follow [07-deployment.md](./07-deployment.md) when ready for production

---

*🧠 Welcome to CATHCR - where fleeting thoughts become lasting insights through the power of AI and beautiful design.*