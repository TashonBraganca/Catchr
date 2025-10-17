# Daily Monitoring Checklist

## Morning Health Check (5 minutes)
**Time:** 9:00 AM daily

### 1. Deployment Status
- [ ] Visit: https://vercel.com/[team]/cathcr/deployments
- [ ] Latest deployment: **Status should be "Ready"** ✅
- [ ] Build time: **Target <3 minutes**
- [ ] No failed deployments in last 24h

**If deployment failed:**
1. Check build logs for errors
2. Review recent commits
3. Rollback if critical issue
4. Create hotfix branch

---

### 2. Production Health Check
- [ ] Visit: https://cathcr.vercel.app
- [ ] Page loads successfully ✅
- [ ] Login works ✅
- [ ] Create note works ✅
- [ ] Voice capture works ✅

**Manual test (2 min):**
1. Open app
2. Create manual note
3. Test voice capture
4. Verify note appears in list

---

### 3. Error Rate Check
- [ ] Visit Sentry: https://sentry.io/organizations/[org]/issues/
- [ ] Total errors last 24h: **Target <10**
- [ ] Critical errors: **Target 0** ⚠️
- [ ] Error rate: **Target <1%** ✅

**Priority levels:**
- 🔴 Critical (P0): Fix immediately
- 🟡 High (P1): Fix today
- 🟢 Medium (P2): Fix this week

**If critical error detected:**
1. Check error details and stack trace
2. Identify affected users
3. Create hotfix if needed
4. Update status page

---

### 4. Performance Metrics
- [ ] Visit Vercel Speed Insights
- [ ] Lighthouse Performance Score: **Target >90**
- [ ] Largest Contentful Paint (LCP): **Target <2.5s** ✅
- [ ] First Input Delay (FID): **Target <100ms** ✅
- [ ] Cumulative Layout Shift (CLS): **Target <0.1** ✅

**Performance thresholds:**
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5-4s | >4s |
| FID | <100ms | 100-300ms | >300ms |
| CLS | <0.1 | 0.1-0.25 | >0.25 |

**If performance degraded:**
1. Run: `npm run analyze:bundle`
2. Check for large JS/CSS files
3. Review recent changes
4. Consider optimization

---

### 5. API Response Times
- [ ] Visit: https://cathcr.vercel.app/api/health
- [ ] Response time: **Target <200ms** ✅
- [ ] All services: **Status "up"** ✅

**Check Vercel Functions dashboard:**
- [ ] Average response time: **<200ms**
- [ ] p95 response time: **<500ms**
- [ ] Error rate: **<2%**
- [ ] Invocation count: Track trends

**If API slow:**
1. Check database query performance
2. Review function logs
3. Check external API latency
4. Scale if needed

---

### 6. Database Performance
- [ ] Visit Supabase Dashboard
- [ ] Database size: **Track growth**
- [ ] Query performance: **Avg <500ms** ✅
- [ ] Connection pool: **No exhaustion** ✅

**Quick checks:**
- [ ] No long-running queries (>5s)
- [ ] No connection pool warnings
- [ ] No out-of-memory errors

**If database slow:**
1. Run: `node scripts/analyze-database-performance.js`
2. Check for missing indexes
3. Review slow queries
4. Optimize RLS policies

---

## Summary Report Template

**Date:** _________

### Status Overview
- Deployment: 🟢 Healthy / 🟡 Degraded / 🔴 Unhealthy
- Errors: 🟢 Low / 🟡 Medium / 🔴 High
- Performance: 🟢 Good / 🟡 Fair / 🔴 Poor
- Database: 🟢 Healthy / 🟡 Degraded / 🔴 Unhealthy

### Key Metrics
- Page Load Time: _____ s
- API Response Time: _____ ms
- Database Query Time: _____ ms
- Error Count (24h): _____
- Error Rate: _____ %

### Issues Detected
1. _____________________
2. _____________________
3. _____________________

### Actions Taken
1. _____________________
2. _____________________
3. _____________________

---

## Weekly Deep Dive (30 minutes)
**Time:** Monday 10:00 AM

### 1. Performance Trends
- [ ] Run: `npm run analyze:bundle`
- [ ] Compare bundle sizes week-over-week
- [ ] Review Core Web Vitals trends
- [ ] Check for performance regression

**Questions to answer:**
- Is page load time trending up?
- Are there new large dependencies?
- Has bundle size increased significantly?
- Are there new performance bottlenecks?

---

### 2. Error Pattern Analysis
- [ ] Group errors by type in Sentry
- [ ] Identify top 5 most frequent errors
- [ ] Check error trends (increasing/decreasing)
- [ ] Review unresolved critical errors

**Create tickets for:**
- Errors affecting >10 users
- Errors with >5% occurrence rate
- All critical/blocking errors

---

### 3. User Flow Analysis
- [ ] Voice-to-note success rate: **Target >98%**
- [ ] Manual note creation success: **Target >99%**
- [ ] Extension connection success: **Target >90%**
- [ ] Calendar integration usage: Track adoption

**Check conversion funnels:**
- Signup → First note: _____ %
- First note → Voice capture: _____ %
- Voice capture → AI categorization: _____ %

---

### 4. Database Optimization
- [ ] Run: `node scripts/analyze-database-performance.js`
- [ ] Review slow query report
- [ ] Check index usage statistics
- [ ] Analyze table growth rates

**Optimization opportunities:**
- Add missing indexes
- Remove unused indexes
- Optimize slow queries
- Archive old data

---

### 5. API Function Review
- [ ] Run: `node scripts/analyze-api-performance.js`
- [ ] Check cold start times
- [ ] Review function configurations
- [ ] Analyze dependency sizes

**Optimization checklist:**
- Functions using Edge Runtime
- Response caching enabled
- Error handling implemented
- Connection pooling configured

---

### 6. Cost Analysis
- [ ] Vercel bandwidth usage: Track trends
- [ ] Supabase database size: Monitor growth
- [ ] API function invocations: Check limits
- [ ] External API costs (OpenAI): Monitor usage

**Cost optimization:**
- Enable caching where possible
- Optimize image delivery
- Review API call patterns
- Consider batch processing

---

## Monthly Health Check (1-2 hours)
**Time:** First Monday of month

### 1. Comprehensive Performance Audit
- [ ] Run full Lighthouse audit on all pages
- [ ] Test on mobile devices
- [ ] Check cross-browser compatibility
- [ ] Review accessibility compliance

---

### 2. Security Review
- [ ] Run: `npm audit`
- [ ] Check Supabase security recommendations
- [ ] Review API endpoint security
- [ ] Verify environment variables

**Security checklist:**
- No critical vulnerabilities
- Dependencies up to date
- RLS policies tested
- API rate limiting enabled

---

### 3. Backup & Recovery
- [ ] Verify database backups are working
- [ ] Test backup restoration process
- [ ] Review disaster recovery plan
- [ ] Update runbooks

---

### 4. Documentation Update
- [ ] Update monitoring thresholds if needed
- [ ] Document new optimizations
- [ ] Update troubleshooting guides
- [ ] Review and update runbooks

---

### 5. Capacity Planning
- [ ] Review growth trends
- [ ] Check resource utilization
- [ ] Plan for scaling needs
- [ ] Update infrastructure roadmap

**Questions to answer:**
- Will we hit any limits next month?
- Do we need to scale database?
- Should we upgrade Vercel plan?
- Are API quotas sufficient?

---

## Incident Response Checklist

### When Alert Triggers

#### 1. Assess Severity
- [ ] Is production down? (P0 - Critical)
- [ ] Are users affected? (P1 - High)
- [ ] Is it isolated? (P2 - Medium)

#### 2. Immediate Actions (P0)
- [ ] Check: https://cathcr.vercel.app/api/health
- [ ] Review latest deployment
- [ ] Check error logs in Sentry
- [ ] Notify team if needed

#### 3. Mitigation
- [ ] Rollback deployment if needed
- [ ] Apply hotfix
- [ ] Scale resources if needed
- [ ] Communicate to users

#### 4. Post-Incident
- [ ] Document root cause
- [ ] Create tickets for fixes
- [ ] Update monitoring
- [ ] Review prevention measures

---

## Quick Reference

### Important URLs
- **Production:** https://cathcr.vercel.app
- **Health Check:** https://cathcr.vercel.app/api/health
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Sentry Dashboard:** https://sentry.io

### Quick Commands
```bash
# Bundle analysis
npm run analyze:bundle

# Database performance
node scripts/analyze-database-performance.js

# API performance
node scripts/analyze-api-performance.js

# Real-time dashboard
node scripts/monitoring-dashboard.js

# Health check
curl https://cathcr.vercel.app/api/health
```

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | 1% | 2% |
| Page Load | 3s | 5s |
| API Response | 500ms | 1s |
| Database Query | 1s | 2s |
| Uptime | 99.5% | 99% |

---

## Notes

**Best Practices:**
- Complete morning check before standup
- Log all issues in tracking system
- Share weekly summary with team
- Review and update checklist monthly

**Emergency Contacts:**
- On-call engineer: _____
- DevOps lead: _____
- Engineering manager: _____

**Escalation Path:**
1. Check runbooks first
2. Contact on-call engineer
3. Escalate to DevOps lead
4. Page engineering manager (P0 only)
