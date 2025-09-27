# Environment Configuration

This document covers all environment variables, secrets management, and configuration requirements for deploying Cathcr across different environments.

## Environment Overview

Cathcr requires configuration for multiple services and environments:
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live production deployment

## Required Environment Variables

### Core Application Variables

#### Server Environment (.env)
```bash
# Node.js Configuration
NODE_ENV=production|development|staging
PORT=3001

# Application Settings
APP_NAME=Cathcr
APP_URL=https://cathcr.com
API_BASE_URL=https://api.cathcr.com

# Security
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters-long
CORS_ORIGIN=https://cathcr.com,https://www.cathcr.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=your-secure-session-secret
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

#### Client Environment (.env)
```bash
# Vite Configuration
VITE_NODE_ENV=production|development|staging
VITE_APP_NAME=Cathcr
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_BASE_URL=https://api.cathcr.com
VITE_WS_URL=wss://realtime.cathcr.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_VOICE_CAPTURE=true
VITE_ENABLE_OFFLINE_MODE=true

# OAuth Redirect URLs
VITE_REDIRECT_URL=https://cathcr.com/auth/callback
VITE_OAUTH_GOOGLE_REDIRECT=https://cathcr.com/auth/google/callback
VITE_OAUTH_GITHUB_REDIRECT=https://cathcr.com/auth/github/callback
```

### External Service Configuration

#### Supabase Configuration
```bash
# Supabase Core
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase Auth
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true
SUPABASE_AUTH_EXTERNAL_GITHUB_ENABLED=true

# Supabase Storage
SUPABASE_STORAGE_BUCKET=cathcr-storage
SUPABASE_STORAGE_AVATARS_BUCKET=avatars
SUPABASE_STORAGE_FILES_BUCKET=files

# Client-side Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### OpenAI Configuration
```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-organization-id
OPENAI_PROJECT=proj-your-project-id

# Model Configuration
OPENAI_MODEL_GPT=gpt-5-mini
OPENAI_MODEL_WHISPER=whisper-1
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.3

# Rate Limiting
OPENAI_RATE_LIMIT_RPM=50
OPENAI_RATE_LIMIT_TPM=40000
OPENAI_TIMEOUT_MS=30000
```

#### Analytics and Monitoring
```bash
# Error Tracking (Sentry)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1

# Analytics (PostHog/Google Analytics)
POSTHOG_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Performance Monitoring
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=Cathcr-Production

# Health Checks
HEALTH_CHECK_INTERVAL=30000
UPTIME_ROBOT_API_KEY=your-uptime-robot-key
```

#### Email and Notifications
```bash
# Email Service (SendGrid/Mailgun)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@cathcr.com
SENDGRID_FROM_NAME=Cathcr

# Push Notifications (Firebase)
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_MESSAGING_SENDER_ID=your-sender-id

# Slack Notifications (for alerts)
SLACK_WEBHOOK_URL=your-slack-webhook-url
SLACK_CHANNEL=#alerts
```

## Environment-Specific Configurations

### Development Environment

#### Server (.env.development)
```bash
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001

# Development Database
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Development OpenAI (use separate project/org for cost control)
OPENAI_API_KEY=sk-your-dev-openai-api-key
OPENAI_ORGANIZATION=org-your-dev-org-id

# Development Security (less restrictive)
JWT_SECRET=development-jwt-secret-32-chars-min
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
RATE_LIMIT_MAX_REQUESTS=1000

# Debug Settings
DEBUG=cathcr:*
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

#### Client (.env.development)
```bash
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_REDIRECT_URL=http://localhost:3000

# Development Features
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG_LOGS=true
```

### Staging Environment

#### Server (.env.staging)
```bash
NODE_ENV=staging
PORT=3001
APP_URL=https://staging.cathcr.com
API_BASE_URL=https://api-staging.cathcr.com

# Staging Database
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Staging OpenAI
OPENAI_API_KEY=sk-your-staging-openai-api-key
OPENAI_ORGANIZATION=org-your-staging-org-id

# Staging Security
JWT_SECRET=staging-jwt-secret-secure-32-chars-minimum
CORS_ORIGIN=https://staging.cathcr.com
COOKIE_SECURE=true
RATE_LIMIT_MAX_REQUESTS=200

# Staging Monitoring
SENTRY_DSN=your-staging-sentry-dsn
SENTRY_ENVIRONMENT=staging
LOG_LEVEL=info
```

#### Client (.env.staging)
```bash
VITE_NODE_ENV=staging
VITE_API_BASE_URL=https://api-staging.cathcr.com
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_REDIRECT_URL=https://staging.cathcr.com

# Staging Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG_LOGS=false
```

### Production Environment

#### Server (.env.production)
```bash
NODE_ENV=production
PORT=3001
APP_URL=https://cathcr.com
API_BASE_URL=https://api.cathcr.com

# Production Database
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Production OpenAI
OPENAI_API_KEY=sk-your-prod-openai-api-key
OPENAI_ORGANIZATION=org-your-prod-org-id

# Production Security
JWT_SECRET=production-jwt-secret-very-secure-64-chars-minimum
CORS_ORIGIN=https://cathcr.com,https://www.cathcr.com
COOKIE_SECURE=true
RATE_LIMIT_MAX_REQUESTS=100

# Production Monitoring
SENTRY_DSN=your-prod-sentry-dsn
SENTRY_ENVIRONMENT=production
NEW_RELIC_LICENSE_KEY=your-prod-license-key
LOG_LEVEL=warn

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
CACHE_TTL=3600
```

#### Client (.env.production)
```bash
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://api.cathcr.com
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_REDIRECT_URL=https://cathcr.com

# Production Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_DEV_TOOLS=false
```

## Secrets Management

### Development Secrets
For local development, use `.env` files (never commit to git):

```bash
# Create environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit with your development values
```

### Production Secrets Management

#### Using Environment Variables (Recommended)
```bash
# Set environment variables in your hosting platform
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export OPENAI_API_KEY="your-key"
export JWT_SECRET="your-secret"
```

#### Using Docker Secrets
```dockerfile
# docker-compose.yml
version: '3.8'
services:
  cathcr-server:
    image: cathcr/server:latest
    secrets:
      - supabase_service_key
      - openai_api_key
      - jwt_secret
    environment:
      - SUPABASE_SERVICE_ROLE_KEY_FILE=/run/secrets/supabase_service_key
      - OPENAI_API_KEY_FILE=/run/secrets/openai_api_key
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  supabase_service_key:
    external: true
  openai_api_key:
    external: true
  jwt_secret:
    external: true
```

#### Using HashiCorp Vault
```typescript
// server/src/config/vault.ts
import vault from 'node-vault';

const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN
});

export const getSecret = async (path: string): Promise<string> => {
  try {
    const result = await vaultClient.read(path);
    return result.data.value;
  } catch (error) {
    console.error(`Failed to read secret from ${path}:`, error);
    throw error;
  }
};

// Usage
const supabaseKey = await getSecret('secret/cathcr/supabase/service-role-key');
```

### Environment Variable Validation

```typescript
// server/src/config/validation.ts
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .required(),

  PORT: Joi.number()
    .port()
    .default(3001),

  SUPABASE_URL: Joi.string()
    .uri()
    .required(),

  SUPABASE_SERVICE_ROLE_KEY: Joi.string()
    .pattern(/^eyJ/)
    .required(),

  OPENAI_API_KEY: Joi.string()
    .pattern(/^sk-/)
    .required(),

  JWT_SECRET: Joi.string()
    .min(32)
    .required(),

  CORS_ORIGIN: Joi.alternatives()
    .try(
      Joi.string().uri(),
      Joi.string().pattern(/^https?:\/\/.+/)
    )
    .required()
}).unknown();

export const validateEnvironment = (): void => {
  const { error, value } = envSchema.validate(process.env);

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  // Set validated environment
  process.env = { ...process.env, ...value };
};
```

## Configuration Loading

### Centralized Configuration

```typescript
// server/src/config/index.ts
import dotenv from 'dotenv';
import { validateEnvironment } from './validation';

// Load environment files based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test'
  ? '.env.test'
  : `.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({ path: envFile });
dotenv.config(); // Load .env as fallback

// Validate environment
validateEnvironment();

export const config = {
  app: {
    name: process.env.APP_NAME || 'Cathcr',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    url: process.env.APP_URL || 'http://localhost:3000'
  },

  database: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },

  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORGANIZATION,
      model: {
        gpt: process.env.OPENAI_MODEL_GPT || 'gpt-5-mini',
        whisper: process.env.OPENAI_MODEL_WHISPER || 'whisper-1'
      }
    }
  },

  security: {
    jwtSecret: process.env.JWT_SECRET!,
    corsOrigin: process.env.CORS_ORIGIN!.split(','),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    sessionSecret: process.env.SESSION_SECRET!
  },

  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME
    }
  }
};
```

### Client Configuration

```typescript
// client/src/config/index.ts
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Cathcr',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_NODE_ENV || 'development'
  },

  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
  },

  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!
  },

  auth: {
    redirectUrl: import.meta.env.VITE_REDIRECT_URL || 'http://localhost:3000'
  },

  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    voiceCapture: import.meta.env.VITE_ENABLE_VOICE_CAPTURE === 'true',
    offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
    devTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'
  }
};

// Validation for client config
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing required Supabase configuration');
}
```

## Security Best Practices

### Secret Rotation

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Rotate JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)
echo "New JWT secret generated"

# Update environment variables
kubectl create secret generic cathcr-secrets \
  --from-literal=jwt-secret="$NEW_JWT_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment to pick up new secrets
kubectl rollout restart deployment/cathcr-server
```

### Environment Isolation

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cathcr-production
  labels:
    environment: production
    app: cathcr
---
apiVersion: v1
kind: Namespace
metadata:
  name: cathcr-staging
  labels:
    environment: staging
    app: cathcr
```

### Secret Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Run TruffleHog
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
```

## Troubleshooting

### Common Configuration Issues

1. **Missing Environment Variables**:
   ```bash
   # Check required variables
   npm run config:check

   # Or manually verify
   node -e "require('./dist/config').validateEnvironment()"
   ```

2. **Invalid Supabase Configuration**:
   ```bash
   # Test Supabase connection
   curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
   ```

3. **OpenAI API Issues**:
   ```bash
   # Test OpenAI API
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
   ```

4. **CORS Issues**:
   ```typescript
   // Verify CORS configuration
   console.log('CORS Origins:', process.env.CORS_ORIGIN?.split(','));
   ```

### Configuration Validation Script

```typescript
// scripts/validate-config.ts
import { config } from '../server/src/config';
import { supabase } from '../server/src/config/supabase';
import OpenAI from 'openai';

async function validateConfiguration(): Promise<void> {
  console.log('🔍 Validating configuration...\n');

  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection: OK');
  } catch (error) {
    console.log('❌ Supabase connection: FAILED');
    console.error(error);
  }

  // Test OpenAI connection
  try {
    const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });
    await openai.models.list();
    console.log('✅ OpenAI connection: OK');
  } catch (error) {
    console.log('❌ OpenAI connection: FAILED');
    console.error(error);
  }

  // Validate security settings
  const issues: string[] = [];

  if (config.security.jwtSecret.length < 32) {
    issues.push('JWT secret is too short (minimum 32 characters)');
  }

  if (config.app.env === 'production' && !config.security.cookieSecure) {
    issues.push('Cookie secure flag should be enabled in production');
  }

  if (issues.length > 0) {
    console.log('❌ Security validation: FAILED');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('✅ Security validation: OK');
  }

  console.log('\n🎉 Configuration validation complete');
}

validateConfiguration().catch(console.error);
```

This comprehensive environment configuration ensures secure, scalable, and maintainable deployments across all environments while following security best practices and providing clear troubleshooting guidance.