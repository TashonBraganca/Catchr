# Vercel Deployment Setup Guide

## Quick Connect Instructions

Your Vercel project is ready to deploy! Follow these steps to connect your GitHub repository:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Login with your account

### 2. Connect GitHub Repository
- Click "Import Project" or "New Project"
- Select "Import Git Repository"
- Choose: `TashonBraganca/Catchr`
- Click "Import"

### 3. Configure Project Settings
- **Project Name**: cathcr (or keep default)
- **Framework Preset**: Vite (should auto-detect)
- **Root Directory**: `./` (default)
- **Build Command**: `cd client && npm run build:vercel`
- **Output Directory**: `client/dist`

### 4. Environment Variables
Add these in Vercel dashboard → Settings → Environment Variables:

**Required:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 5. Deploy
- Click "Deploy"
- Your site will be live at: https://catchr.vercel.app/

## Project Details
- **Project ID**: prj_PJPotKO2qVlfnmOgPdDuYzKqjnSH
- **Repository**: https://github.com/TashonBraganca/Catchr.git
- **Branch**: main

## Build Configuration
The repository includes:
- ✅ `vercel.json` configuration
- ✅ `build:vercel` script (skips TypeScript for faster builds)
- ✅ Proper output directory structure
- ✅ Static file routing

## Troubleshooting
If build fails:
1. Check environment variables are set
2. Verify build command: `cd client && npm run build:vercel`
3. Ensure output directory: `client/dist`
4. Check Vercel build logs for specific errors

Once connected, deployments will be automatic on every push to main branch.