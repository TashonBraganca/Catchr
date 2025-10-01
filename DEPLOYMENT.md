# 🚀 CATCHR PRODUCTION DEPLOYMENT GUIDE

## **Pre-Deployment Checklist**

### ✅ **Environment Variables**

#### **Server (.env)**
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# OpenAI (GPT-5)
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_org_id

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://catchr.vercel.app/api/calendar/callback

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://catchr.vercel.app

# Optional: Hugging Face (Whisper fallback)
HUGGINGFACE_API_KEY=your_hf_api_key
```

#### **Client (.env)**
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://catchr.vercel.app/api
```

---

## **🔧 Build & Deploy Steps**

### **1. Database Migration (Supabase)**

```bash
# Apply migrations
npx supabase db push

# Or manually run migrations:
# - 001_initial_schema.sql
# - 002_add_user_patterns.sql
# - 003_add_calendar_integration.sql
```

### **2. Client Build (Vercel)**

```bash
cd client
npm run build

# Verify build output
ls -la dist/
```

**Vercel Configuration:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `client`

### **3. Server Deploy (Vercel Serverless)**

```bash
cd server
npm run build

# Deploy serverless functions
vercel --prod
```

**Vercel Configuration:**
- Framework: Express
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `server`

---

## **📦 Extension Deployment**

### **Option 1: Direct Download (Current)**
1. Zip extension folder: `extension/catchr-extension-v1.0.0.zip`
2. Upload to `client/public/downloads/`
3. Users download from `catchr.vercel.app/install`

### **Option 2: Chrome Web Store (Future)**
1. Create developer account ($5 one-time)
2. Prepare store listing with screenshots
3. Submit for review (2-3 days)
4. Publish to store

---

## **🔐 Security Checklist**

- [ ] All API keys in environment variables (not committed)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on all endpoints (30 req/min)
- [ ] Supabase RLS policies active on all tables
- [ ] OAuth tokens encrypted in database
- [ ] HTTPS enforced on all endpoints
- [ ] Helmet middleware configured
- [ ] Input validation on all routes
- [ ] Error messages sanitized (no internal details)

---

## **📊 Monitoring Setup**

### **Vercel Analytics**
```bash
npm install @vercel/analytics
```

Add to `client/src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';
inject();
```

### **Error Tracking (Sentry)**
```bash
npm install @sentry/react @sentry/node
```

**Client Setup:**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production",
});
```

**Server Setup:**
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production",
});
```

---

## **⚡ Performance Optimization**

### **Client Optimizations**
- [x] Code splitting with lazy loading
- [x] Image optimization (WebP, lazy loading)
- [x] Bundle size < 500KB gzipped
- [x] Virtual scrolling for note lists
- [ ] Service worker for offline support
- [ ] PWA manifest

### **Server Optimizations**
- [x] Response compression (gzip)
- [x] Rate limiting
- [x] Database connection pooling
- [ ] Redis caching for frequent queries
- [ ] CDN for static assets

---

## **🧪 Pre-Launch Testing**

### **Manual Testing**
- [ ] Voice capture works on all major sites
- [ ] GPT-5 categorization accurate (95%+)
- [ ] Calendar integration creates events correctly
- [ ] Extension installation flow smooth
- [ ] Mobile responsive (test on iPhone/Android)
- [ ] Cross-browser (Chrome, Edge, Brave)

### **Automated Testing**
```bash
# Client E2E tests
cd client
npm run test:e2e

# Server API tests
cd server
npm run test

# Load testing
npx artillery quick --count 100 --num 10 https://catchr.vercel.app/api/health
```

---

## **🚦 Deployment Commands**

### **Full Production Deploy**
```bash
# 1. Run migrations
npx supabase db push --remote

# 2. Build client
cd client && npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
curl https://catchr.vercel.app/health
```

### **Rollback Plan**
```bash
# Revert to previous deployment
vercel rollback

# Or deploy specific commit
git checkout <previous-commit-sha>
vercel --prod
```

---

## **📈 Post-Launch Monitoring**

### **Week 1: Critical Metrics**
| Metric | Target | Monitor |
|--------|--------|---------|
| Uptime | 99.9% | Vercel status |
| API Response Time | <500ms | Vercel analytics |
| Error Rate | <1% | Sentry |
| Voice Capture Success | >95% | Custom logs |
| GPT-5 Accuracy | >95% | User feedback |

### **Week 2-4: Growth Metrics**
- Daily Active Users (DAU)
- Thoughts captured per user
- Calendar events created
- Extension installations
- User retention rate

---

## **🐛 Common Issues & Solutions**

### **Issue: GPT-5 Rate Limiting**
**Solution**: Implement queue system with Redis + Bull
```bash
npm install bull redis
```

### **Issue: Vercel Serverless Timeout**
**Solution**: Move long-running tasks to background workers
```typescript
// Use Vercel background functions
export const config = {
  maxDuration: 60, // 60 seconds for Pro plan
};
```

### **Issue: Extension Not Loading**
**Solution**: Check manifest.json permissions and host_permissions

### **Issue: Calendar OAuth Redirect Fails**
**Solution**: Verify redirect URI in Google Cloud Console matches exactly

---

## **📞 Support & Escalation**

### **Critical Issues (P0)**
- Service completely down
- Data loss or corruption
- Security breach

**Action**: Immediate rollback + post-mortem

### **High Priority (P1)**
- Major feature broken (voice, AI, calendar)
- Performance degradation >50%

**Action**: Fix within 4 hours

### **Medium Priority (P2)**
- Minor feature issues
- UI bugs
- Performance issues <50%

**Action**: Fix within 24 hours

---

## **🎯 Launch Day Checklist**

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Client & server deployed to Vercel
- [ ] Extension .zip available for download
- [ ] Health check endpoint returning 200
- [ ] Sentry error tracking active
- [ ] Analytics tracking enabled
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] SSL certificate valid
- [ ] Documentation updated
- [ ] Team notified and ready
- [ ] Rollback plan tested
- [ ] Backup database taken

---

## **🚀 GO LIVE!**

Once all checks pass:
```bash
# Final deployment
vercel --prod

# Verify
curl https://catchr.vercel.app/health

# Monitor dashboards
open https://vercel.com/dashboard
open https://sentry.io
open https://supabase.com/dashboard
```

**Catchr is LIVE!** 🎉

*"Capture at the speed of thought, organize at the speed of AI"*
