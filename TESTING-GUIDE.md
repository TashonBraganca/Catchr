# 🧪 CATHCR - Testing Guide

**Date**: 2025-10-02
**Updated**: 2025-10-02 (Issues found and fixed)
**Environment**: Local development
**Status**: ✅ All critical issues fixed, ready for testing

---

## 🔧 ISSUES FOUND & FIXED

### ✅ Issue #1: Vite Proxy Port Mismatch (CRITICAL)
**Problem**: Vite proxy was pointing to `http://localhost:3001` but server runs on port `5003`
**Impact**: All `/api/*` calls failed with `ECONNREFUSED`
**Fix Applied**: Updated `client/vite.config.ts` proxy target to `http://localhost:5003`
**Status**: ✅ **FIXED** - Server auto-restarted

### ✅ Issue #2: CORS Origin Mismatch (HIGH)
**Problem**: Server `.env` had `CORS_ORIGIN=http://localhost:3007` but client runs on `3000`
**Impact**: Potential CORS errors blocking API requests
**Fix Applied**: Updated `server/.env` to `CORS_ORIGIN=http://localhost:3000`
**Status**: ✅ **FIXED** - Server auto-restarted

### ✅ Issue #3: Missing Favicon Handler (LOW)
**Problem**: Server returned 404 for `/favicon.ico` cluttering console
**Impact**: Console noise, no functional impact
**Fix Applied**: Added `app.get('/favicon.ico')` handler returning 204 No Content
**Status**: ✅ **FIXED** - Server auto-restarted

### ⚠️ Issue #4: HuggingFace API Token (WARNING)
**Problem**: HuggingFace Whisper disabled (token not configured)
**Impact**: Voice transcription falls back to browser Web Speech API
**Status**: ⚠️ **ACCEPTABLE** - Browser API works as fallback
**Note**: Can add token later if needed for server-side transcription

---

## 🚀 Prerequisites

### ✅ Completed Setup
- [x] All 3 database migrations applied (0 security errors)
- [x] 14 tables created with RLS enabled
- [x] 15 functions with proper security
- [x] 5 views secured
- [x] Client server running on http://localhost:3000
- [x] API server running on http://localhost:5003

### ✅ Server Status (After Fixes)
```
Backend API (port 5003):
✅ GPT-5 Mini Orchestrator initialized
✅ Supabase connected
✅ Google Calendar Service initialized
✅ CORS origin fixed (now accepts requests from port 3000)
✅ Favicon handler added (no more 404 errors)
⚠️ HuggingFace Whisper disabled (acceptable - browser fallback works)

Frontend (port 3000):
✅ Vite dev server ready
✅ Proxy fixed (now correctly points to port 5003)
✅ All /api/* requests now routed correctly
```

### ✅ Configuration Changes Applied
- **client/vite.config.ts**: Proxy target changed from `3001` → `5003`
- **server/.env**: CORS_ORIGIN changed from `3007` → `3000`
- **server/src/index.ts**: Added favicon handler to prevent 404s

---

## 📋 Testing Checklist

### **Phase 1: Authentication** 🔐

#### Test 1.1: Sign Up
1. **Action**: Open http://localhost:3000
2. **Expected**: See login/signup page
3. **Action**: Click "Sign Up" or create account
4. **Test Input**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
5. **Expected Results**:
   - [  ] No console errors
   - [  ] Account created successfully
   - [  ] Redirected to main app
   - [  ] Profile created in database

#### Test 1.2: Sign In
1. **Action**: Log out (if logged in)
2. **Action**: Sign in with credentials
3. **Expected Results**:
   - [  ] Login successful
   - [  ] Session persists
   - [  ] User data loaded

#### Test 1.3: Session Persistence
1. **Action**: Refresh the page (F5)
2. **Expected Results**:
   - [  ] Still logged in
   - [  ] No re-authentication required

#### Verify in Supabase:
- Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/editor
- Table: `profiles`
- **Expected**: Your user profile exists with:
  - `id` (UUID matching auth.users)
  - `username` (extracted from email or set)
  - `created_at` timestamp
  - `updated_at` timestamp

---

### **Phase 2: Note Creation & Database Persistence** 📝

#### Test 2.1: Create Simple Note
1. **Action**: Create a new note manually
2. **Test Input**: "This is a test note"
3. **Expected Results**:
   - [  ] Note appears in UI immediately
   - [  ] No console errors
   - [  ] Loading indicator (if any)

#### Test 2.2: Database Persistence
1. **Action**: Refresh the page (F5)
2. **Expected Results**:
   - [  ] Note still visible after refresh
   - [  ] Note data persists

#### Test 2.3: Verify in Supabase
1. **Action**: Go to Supabase Table Editor
   - URL: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/editor
2. **Action**: Open `thoughts` table
3. **Expected**: Your note exists with:
   - [  ] `id` (UUID)
   - [  ] `user_id` (matches your profile ID)
   - [  ] `content` ("This is a test note")
   - [  ] `created_at` timestamp
   - [  ] `updated_at` timestamp

#### Test 2.4: Create Multiple Notes
1. **Action**: Create 3 more notes:
   - "Buy groceries - milk, eggs, bread"
   - "Meeting with team tomorrow at 2pm"
   - "Research React performance optimization"
2. **Expected Results**:
   - [  ] All 4 notes visible in UI
   - [  ] Notes appear in correct order (newest first?)
   - [  ] All 4 notes exist in Supabase `thoughts` table

---

### **Phase 3: GPT-5 AI Categorization** 🤖

#### Test 3.1: Reminder Categorization
1. **Action**: Create note:
   ```
   Reminder to call John tomorrow at 3pm about the project presentation
   ```
2. **Expected AI Analysis**:
   - [  ] Category: `reminder` or `task`
   - [  ] Tags: Should include `["call", "John", "project"]`
   - [  ] Priority: `high` or `medium`
   - [  ] Extracted entities:
     - Person: "John"
     - Time: "tomorrow at 3pm"
     - Topic: "project presentation"

#### Test 3.2: Idea Categorization
1. **Action**: Create note:
   ```
   What if we built a Chrome extension that captures thoughts with voice recognition?
   ```
2. **Expected AI Analysis**:
   - [  ] Category: `idea` or `note`
   - [  ] Tags: `["chrome extension", "voice recognition", "product idea"]`
   - [  ] Priority: `medium` or `low`
   - [  ] Extracted entities:
     - Topic: "Chrome extension", "voice recognition"

#### Test 3.3: Task Categorization
1. **Action**: Create note:
   ```
   Finish database migrations and deploy to Vercel by Friday
   ```
2. **Expected AI Analysis**:
   - [  ] Category: `task` or `work`
   - [  ] Tags: `["database", "deployment", "deadline"]`
   - [  ] Priority: `high`
   - [  ] Extracted entities:
     - Deadline: "Friday"
     - Topics: "database migrations", "Vercel"

#### Verify in Supabase:
- Open `thoughts` table
- Check the AI-categorized notes have:
  - [  ] `category` field populated (JSON object with `main`, `sub`)
  - [  ] `tags` array populated
  - [  ] `ai_confidence` score (0.0 to 1.0)
  - [  ] `is_processed` = `true`

---

### **Phase 4: Voice Capture** 🎤

#### Test 4.1: Voice Recording
1. **Action**: Click microphone button
2. **Expected**:
   - [  ] Browser asks for microphone permission
   - [  ] Recording indicator appears
   - [  ] Waveform or visual feedback (if implemented)

#### Test 4.2: Voice Transcription
1. **Action**: Speak clearly:
   ```
   "Remind me to email Sarah about the meeting notes by end of day"
   ```
2. **Action**: Stop recording
3. **Expected Results**:
   - [  ] Transcription appears in UI
   - [  ] Text is accurate (>80% correct)
   - [  ] Auto-saves to database

#### Test 4.3: Voice + AI Integration
1. **Expected After Transcription**:
   - [  ] GPT-5 automatically categorizes speech
   - [  ] Category: `reminder` or `task`
   - [  ] Tags: `["email", "Sarah", "meeting notes", "deadline"]`
   - [  ] Entities: Person="Sarah", Deadline="end of day"

#### Known Limitation:
⚠️ **HuggingFace Whisper disabled** (token not configured)
- If voice transcription fails, this is expected
- Voice capture will use browser's Web Speech API instead
- To fix: Add `HUGGINGFACE_API_TOKEN` to `server/.env`

---

### **Phase 5: Google Calendar Integration** 📅

#### Test 5.1: Connect Calendar
1. **Action**: Go to Settings or Calendar section
2. **Action**: Click "Connect Google Calendar"
3. **Expected**:
   - [  ] Google OAuth consent screen appears
   - [  ] Can authorize Cathcr
   - [  ] Redirects back to app

#### Test 5.2: Natural Language Event Creation
1. **Action**: Create note:
   ```
   Meeting with engineering team tomorrow at 10am to discuss Q4 roadmap
   ```
2. **Expected**:
   - [  ] GPT-5 detects event
   - [  ] Option to "Add to Calendar" appears
   - [  ] Click to create event
   - [  ] Event appears in Google Calendar

---

## 🐛 Troubleshooting

### Issue: Can't sign up/login
**Check**:
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed requests
4. Verify Supabase URL/keys in `client/.env`:
   ```
   VITE_SUPABASE_URL=https://jrowrloysdkluxtgzvxm.supabase.co
   VITE_SUPABASE_ANON_KEY=<your_key>
   ```

### Issue: Notes don't save
**Check**:
1. Console errors
2. Supabase RLS policies enabled
3. User is authenticated
4. Network tab shows POST requests to `/api/capture` or Supabase

### Issue: GPT-5 not categorizing
**Check**:
1. Server logs: `BashOutput fe60e8` (server terminal)
2. OpenAI API key in `server/.env`:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```
3. Network tab: POST to `/api/ai/categorize` returns 200
4. Response includes `category`, `tags`, `confidence`

### Issue: Voice capture not working
**Check**:
1. Microphone permissions granted
2. Browser supports Web Speech API (Chrome recommended)
3. HTTPS or localhost (required for microphone access)
4. HuggingFace token configured (optional, fallback to browser API)

---

## ✅ Success Criteria

### Minimum Viable Product (MVP)
- [  ] User can sign up/login
- [  ] User can create notes
- [  ] Notes persist after refresh
- [  ] Notes appear in Supabase database

### Full Feature Set
- [  ] GPT-5 categorizes notes automatically
- [  ] Voice capture works
- [  ] Voice transcription works
- [  ] AI detects categories, tags, entities, priorities
- [  ] Calendar integration creates events

---

## 📊 Results Summary

After testing, fill out this summary:

### What Works ✅
-
-
-

### What Needs Fixing ❌
-
-
-

### Console Errors Found 🐛
```
(Paste any error messages here)
```

### Database Verification
- Total notes created: __
- Notes in Supabase: __
- RLS working correctly: Yes / No
- AI categorization working: Yes / No

---

## 📞 Next Steps After Testing

**If all tests pass:**
1. Proceed to Vercel deployment
2. Test production environment
3. Set up monitoring

**If tests fail:**
1. Document errors in this file
2. Share console logs
3. Claude will fix issues
4. Re-test

---

*Generated: 2025-10-02*
*Servers: Client (3000), API (5003)*
*Database: Supabase (0 security errors)*
