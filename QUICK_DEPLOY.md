# Quick Deployment Commands

## 1. Framework Identified
✅ **React + Vite** - Modern React app with Vite build tool
✅ **Firebase** - Backend (Auth, Firestore, Storage)
✅ **Tailwind CSS** - Styling

## 2. Deployment Platform
✅ **Vercel** - Best choice for Vite apps (automatic builds, easy domain setup)

## 3. Files Created/Updated
✅ `.env.local` - Environment variables (gitignored)
✅ `.env.example` - Template for environment variables
✅ `vercel.json` - Vercel deployment configuration
✅ `src/firebase/config.js` - Updated to use environment variables
✅ `.gitignore` - Updated to exclude .env files

---

## Quick Start Commands

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy to Production
```bash
vercel --prod
```

### Step 4: Add Environment Variables in Vercel Dashboard
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these 7 variables (from your `.env.local` file):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Step 5: Redeploy After Adding Variables
```bash
vercel --prod
```

### Step 6: Connect Domain in Vercel Dashboard
1. Go to: Settings → Domains
2. Add: `tradetrack.co.uk`
3. Follow DNS instructions shown in Vercel

### Step 7: Update Firebase Authorized Domains
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add: `tradetrack.co.uk`
3. Add: `www.tradetrack.co.uk`
4. Add: `your-app.vercel.app` (your Vercel URL)

---

## Test Build Locally
```bash
npm run build    # Build for production
npm run preview  # Preview production build at http://localhost:4173
```

---

## Full Documentation
See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

