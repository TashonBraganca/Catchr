# Production Monitoring & Optimization Guide

## Table of Contents
1. [Monitoring Strategy](#monitoring-strategy)
2. [Key Metrics & Targets](#key-metrics--targets)
3. [Vercel Analytics Setup](#vercel-analytics-setup)
4. [Supabase Monitoring](#supabase-monitoring)
5. [Custom Metrics Tracking](#custom-metrics-tracking)
6. [Error Tracking with Sentry](#error-tracking-with-sentry)
7. [Performance Optimization](#performance-optimization)
8. [Daily Monitoring Checklist](#daily-monitoring-checklist)

---

## Monitoring Strategy

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    MONITORING STACK                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Vercel    │  │  Supabase    │  │    Sentry      │ │
│  │  Analytics  │  │    Logs      │  │  Error Track   │ │
│  │             │  │              │  │                │ │
│  │ • Page Load │  │ • DB Queries │  │ • JS Errors    │ │
│  │ • Web Vitals│  │ • RLS Policy │  │ • API Fails    │ │
│  │ • Traffic   │  │ • Function   │  │ • Stack Trace  │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Custom Performance Logger                   │ │
│  │  • Voice Processing Time                             │ │
│  │  • AI Categorization Latency                         │ │
│  │  • Note CRUD Operations                              │ │
│  │  • User Flow Metrics                                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Monitoring Layers

| Layer | Tool | Purpose | Alert Threshold |
|-------|------|---------|-----------------|
| **Frontend Performance** | Vercel Analytics | Core Web Vitals, page load | LCP >2.5s, FID >100ms |
| **Database** | Supabase Logs | Query performance, RLS | Query >500ms, Error >1% |
| **API Functions** | Vercel Functions | Response time, errors | >200ms, Error >2% |
| **Error Tracking** | Sentry (optional) | JS errors, API failures | Error rate >1% |
| **Custom Metrics** | Performance Logger | Voice/AI workflows | Voice >5s, AI >3s |
| **User Experience** | Custom Analytics | Feature usage, flows | Conversion <95% |

---

## Key Metrics & Targets

### Critical Performance Metrics

| Metric | Target | Warning | Critical | How to Monitor |
|--------|--------|---------|----------|----------------|
| **Page Load Time (LCP)** | <2s | 2-3s | >3s | Vercel Analytics |
| **First Input Delay (FID)** | <100ms | 100-300ms | >300ms | Vercel Analytics |
| **Cumulative Layout Shift (CLS)** | <0.1 | 0.1-0.25 | >0.25 | Vercel Analytics |
| **Voice Processing** | <5s | 5-8s | >8s | Custom Logger |
| **AI Categorization** | <3s | 3-5s | >5s | Custom Logger |
| **Database INSERT** | <500ms | 500ms-1s | >1s | Supabase Logs |
| **Database SELECT** | <200ms | 200-500ms | >500ms | Supabase Logs |
| **API Response** | <200ms | 200-500ms | >500ms | Vercel Functions |
| **Error Rate** | <1% | 1-2% | >2% | Sentry/Custom |
| **Note Creation Success** | >98% | 95-98% | <95% | Custom Logger |

### User Flow Metrics

| Flow | Target Success Rate | Tracking Method |
|------|---------------------|-----------------|
| Voice → Transcript | >99% | Custom Logger |
| Transcript → AI Categorization | >95% | Custom Logger |
| AI → Database Save | >98% | Custom Logger |
| Manual Note Creation | >99.5% | Custom Logger |
| Extension Connection | >90% | Custom Logger |
| Calendar Event Creation | >95% | Custom Logger |

---

## Vercel Analytics Setup

### 1. Enable Vercel Analytics

**In Vercel Dashboard:**
1. Go to your project: https://vercel.com/your-project
2. Navigate to "Analytics" tab
3. Enable "Web Analytics" (FREE tier available)
4. Enable "Speed Insights" for Core Web Vitals

**Add to your app:**
```typescript
// client/src/main.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
```

### 2. Install Dependencies
```bash
cd client
npm install @vercel/analytics @vercel/speed-insights
```

### 3. Environment Variables
```bash
# No environment variables needed for basic analytics
# Vercel automatically injects analytics in production
```

### 4. Monitoring Dashboard

Access your analytics at:
- **Traffic**: `https://vercel.com/[team]/[project]/analytics`
- **Speed Insights**: `https://vercel.com/[team]/[project]/speed-insights`

**What to Monitor:**
- Page views and unique visitors
- Top pages by traffic
- Core Web Vitals (LCP, FID, CLS)
- Slowest pages
- Real User Monitoring (RUM) scores

---

## Supabase Monitoring

### 1. Database Performance Dashboard

**Access Supabase Dashboard:**
```
https://supabase.com/dashboard/project/[project-id]/logs/explorer
```

**Key Queries to Monitor:**

#### Slow Query Detection
```sql
-- Find queries taking >500ms
SELECT
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as mean_seconds,
  max_exec_time / 1000 as max_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Active Queries
```sql
-- Monitor currently running queries
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

#### Database Size Monitoring
```sql
-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. RLS Policy Performance

**Monitor RLS overhead:**
```sql
-- Check for slow RLS policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Test policy performance
EXPLAIN ANALYZE
SELECT * FROM thoughts
WHERE user_id = auth.uid()
LIMIT 10;
```

### 3. Function Monitoring

**Track function performance:**
```sql
-- Monitor database functions
SELECT
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

### 4. Connection Pool Monitoring

**Check connection usage:**
```sql
-- Monitor active connections
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;
```

---

## Custom Metrics Tracking

See `client/src/lib/monitoring/performanceLogger.ts` for implementation.

### Usage Examples:

```typescript
import { performanceLogger } from '@/lib/monitoring/performanceLogger';

// Track voice processing
const voiceTimer = performanceLogger.startTimer('voice_processing');
// ... process voice
performanceLogger.endTimer(voiceTimer, { userId: 'user-123' });

// Track AI categorization
await performanceLogger.trackAsync(
  'ai_categorization',
  () => categorizeThought(text),
  { model: 'gpt-5-nano' }
);

// Track user flow
performanceLogger.trackUserFlow('voice_to_note_success', {
  duration: 3500,
  steps: ['voice', 'transcript', 'ai', 'db']
});

// Get performance report
const report = performanceLogger.getReport();
console.log('Performance Report:', report);
```

---

## Error Tracking with Sentry

### 1. Install Sentry

```bash
cd client
npm install @sentry/react @sentry/vite-plugin
```

### 2. Configure Sentry

**Create configuration file:**
See `client/src/lib/monitoring/sentry.ts`

**Update main.tsx:**
```typescript
// client/src/main.tsx
import { initSentry } from './lib/monitoring/sentry';

// Initialize Sentry before app render
if (import.meta.env.PROD) {
  initSentry();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

### 3. Environment Variables

```bash
# .env.production
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

### 4. Sentry Dashboard

Access your errors at:
```
https://sentry.io/organizations/[org]/issues/
```

**What to Monitor:**
- Error frequency and trends
- Most common errors
- Affected users
- Stack traces and breadcrumbs
- Performance issues

---

## Performance Optimization

### Bundle Size Analysis

**Run bundle analyzer:**
```bash
cd client
npm run build -- --analyze
```

**Analyze output:**
```bash
# Check bundle sizes
ls -lh dist/assets/*.js

# Target: Main bundle <500KB gzipped
# Vendor bundle <300KB gzipped
```

**Optimization Actions:**

| Issue | Threshold | Action |
|-------|-----------|--------|
| Main bundle >500KB | Warning | Code splitting, lazy loading |
| Vendor bundle >300KB | Warning | Dynamic imports, tree shaking |
| Total page size >1MB | Critical | Image optimization, compression |
| TTI >3s | Warning | Reduce JS, defer non-critical |

### Database Query Optimization

**Run query analysis:**
```bash
node scripts/analyze-database-performance.js
```

**Optimization Actions:**

| Issue | Action |
|-------|--------|
| Query >500ms | Add index, optimize joins |
| Sequential scans | Create covering index |
| RLS overhead | Optimize policy, use security definer |
| N+1 queries | Batch queries, use joins |

### API Latency Optimization

**Profile API endpoints:**
```bash
node scripts/analyze-api-performance.js
```

**Optimization Actions:**

| Issue | Action |
|-------|--------|
| Cold start >1s | Increase memory, add warming |
| Database wait >200ms | Connection pooling, caching |
| External API >2s | Parallel requests, caching |
| JSON parsing >50ms | Streaming, smaller payloads |

---

## Daily Monitoring Checklist

### Morning Check (5 minutes)

```
□ Check Vercel deployment status
  ✓ Go to: https://vercel.com/[team]/[project]/deployments
  ✓ Verify latest deployment is successful
  ✓ Check build time (<3 minutes target)

□ Review error rate (<1% target)
  ✓ Sentry: https://sentry.io/organizations/[org]/issues/
  ✓ Check for new critical errors
  ✓ Verify error count trend

□ Check Core Web Vitals
  ✓ Vercel Speed Insights
  ✓ LCP <2.5s, FID <100ms, CLS <0.1
  ✓ Compare to yesterday

□ Verify API response times
  ✓ Vercel Functions dashboard
  ✓ Average <200ms, p95 <500ms
  ✓ Check for timeout errors

□ Database performance check
  ✓ Supabase dashboard
  ✓ Query time <500ms average
  ✓ No connection pool exhaustion
```

### Weekly Deep Dive (30 minutes)

```
□ Performance trends analysis
  ✓ Compare metrics week-over-week
  ✓ Identify degradation patterns
  ✓ Review optimization opportunities

□ Error pattern analysis
  ✓ Group errors by type
  ✓ Identify recurring issues
  ✓ Plan fixes for top 3 errors

□ User flow analysis
  ✓ Voice-to-note success rate
  ✓ Extension connection success
  ✓ Calendar integration usage

□ Database optimization
  ✓ Run slow query analysis
  ✓ Review index usage
  ✓ Check table bloat

□ Bundle size review
  ✓ Run bundle analyzer
  ✓ Identify large dependencies
  ✓ Plan code splitting improvements

□ Capacity planning
  ✓ Storage usage trends
  ✓ API request volume
  ✓ Database connection usage
```

### Monthly Health Check (1-2 hours)

```
□ Comprehensive performance audit
  ✓ Full Lighthouse audit
  ✓ Core Web Vitals across pages
  ✓ Mobile performance testing

□ Security review
  ✓ Dependency vulnerabilities (npm audit)
  ✓ Supabase security recommendations
  ✓ API endpoint security

□ Cost optimization
  ✓ Vercel bandwidth usage
  ✓ Supabase database size
  ✓ API function invocations

□ User experience analysis
  ✓ Feature usage statistics
  ✓ User feedback review
  ✓ Conversion funnel analysis

□ Documentation update
  ✓ Update monitoring thresholds
  ✓ Document new optimizations
  ✓ Update runbooks
```

---

## Automated Monitoring Scripts

### Performance Dashboard

**View real-time metrics:**
```bash
npm run monitor:dashboard
```

### Alert System

**Setup alerts (optional - requires external service):**
```bash
# Configure alerts in scripts/monitoring/alerts.config.js
npm run monitor:setup-alerts
```

### Health Check Endpoint

**API endpoint for monitoring:**
```
GET /api/health
Response: {
  status: 'healthy',
  timestamp: '2025-10-16T12:00:00Z',
  services: {
    database: 'up',
    api: 'up',
    openai: 'up'
  },
  metrics: {
    responseTime: 45,
    errorRate: 0.002
  }
}
```

---

## Troubleshooting Guide

### Performance Issues

**Symptom: Page load >3s**
1. Check Vercel Analytics for bottleneck
2. Run bundle analyzer
3. Profile main thread in Chrome DevTools
4. Optimize largest contentful paint

**Symptom: Database queries >1s**
1. Check Supabase logs for slow queries
2. Run EXPLAIN ANALYZE on slow queries
3. Add missing indexes
4. Optimize RLS policies

**Symptom: API timeouts**
1. Check Vercel Functions logs
2. Profile function execution
3. Check external API latency
4. Optimize database queries in function

### Error Rate Spikes

**Symptom: Error rate >2%**
1. Check Sentry for error patterns
2. Review recent deployments
3. Check for external service issues
4. Roll back if needed

**Symptom: Database connection errors**
1. Check connection pool usage
2. Review concurrent request volume
3. Optimize long-running queries
4. Scale database if needed

---

## Success Metrics Dashboard

Track these KPIs in your monitoring dashboard:

### Availability
- **Uptime**: >99.9%
- **Failed requests**: <0.1%

### Performance
- **Page load**: <2s (p95)
- **API response**: <200ms (p95)
- **Database query**: <500ms (p95)

### User Experience
- **Voice-to-note success**: >98%
- **Note creation success**: >99%
- **Error-free sessions**: >99%

### Business Metrics
- **Daily active users**: Track growth
- **Notes created per user**: Engagement
- **Extension connections**: Adoption

---

## Next Steps

1. **Immediate (Today)**
   - Enable Vercel Analytics
   - Set up custom performance logger
   - Configure Supabase log alerts

2. **This Week**
   - Install and configure Sentry
   - Create monitoring dashboard
   - Set up daily checklist routine

3. **This Month**
   - Establish performance baselines
   - Create automated alert system
   - Optimize identified bottlenecks

---

**Monitoring is a continuous process. Review and adjust thresholds as your application scales.**

**Production URL:** https://cathcr.vercel.app
**Supabase Dashboard:** https://supabase.com/dashboard
**Vercel Dashboard:** https://vercel.com/dashboard
