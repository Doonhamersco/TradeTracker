# Deployment Guide: Trade Tracker to tradetrack.co.uk

## Framework & Stack Identified

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Tailwind CSS
- **Deployment Platform**: Vercel (recommended)

---

## Step 1: Prepare Environment Variables

### Create `.env.local` file (DO NOT commit this to git)

Create a file named `.env.local` in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyC3opD6kMJtmjK1jc_uj9EPw0Ug17J9-Uk
VITE_FIREBASE_AUTH_DOMAIN=trade-tracker-e8b03.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trade-tracker-e8b03
VITE_FIREBASE_STORAGE_BUCKET=trade-tracker-e8b03.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=728587125120
VITE_FIREBASE_APP_ID=1:728587125120:web:5127357c25cd064823c165
VITE_FIREBASE_MEASUREMENT_ID=G-0B8NJV4NFS
```

**Note**: The `.env.local` file is already in `.gitignore` and will not be committed.

---

## Step 2: Test Production Build Locally

Before deploying, test that your production build works:

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

Visit `http://localhost:4173` to verify everything works correctly.

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to production**:
   ```bash
   vercel --prod
   ```

   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: `trade-tracker` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? **No**

4. **Add Environment Variables in Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add each variable from your `.env.local` file:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
   - Set them for **Production**, **Preview**, and **Development** environments
   - Click **Save**

5. **Redeploy after adding environment variables**:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via GitHub Integration

1. **Push your code to GitHub** (if not already):
   ```bash
   git init  # if not already a git repo
   git add .
   git commit -m "Prepare for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New Project**
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `./`
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `dist` (auto-detected)
   - Click **Deploy**

3. **Add Environment Variables** (same as Option A, Step 4)

4. **Redeploy**: Vercel will automatically redeploy when you push changes, or you can trigger a manual redeploy from the dashboard.

---

## Step 4: Connect Custom Domain (tradetrack.co.uk)

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter `tradetrack.co.uk`
4. Click **Add**

### Configure DNS Records:

Vercel will show you the DNS records to add. You'll need to add these to your domain registrar (where you bought tradetrack.co.uk):

**For Root Domain (tradetrack.co.uk)**:
- **Type**: `A`
- **Name**: `@` (or leave blank)
- **Value**: `76.76.21.21` (Vercel's IP - check Vercel dashboard for current IP)

**For WWW Subdomain (www.tradetrack.co.uk)**:
- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com` (or the value shown in Vercel dashboard)

**Alternative (Easier)**: Use Vercel's nameservers:
- Go to your domain registrar
- Change nameservers to:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`

### Wait for DNS Propagation:

- DNS changes can take 24-48 hours to propagate globally
- Vercel will show the status: "Valid Configuration" when ready
- You can check status: `dig tradetrack.co.uk` or use online DNS checkers

---

## Step 5: Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **trade-tracker-e8b03**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `tradetrack.co.uk`
6. Add: `www.tradetrack.co.uk`
7. Add: `your-vercel-app.vercel.app` (your Vercel preview URL)

This ensures Firebase Authentication works on your custom domain.

---

## Step 6: Verify Deployment

1. Visit `https://tradetrack.co.uk`
2. Test all features:
   - User registration/login
   - Adding trades
   - Viewing trade history
   - PNL calculations
   - Image uploads (PNL backgrounds)
   - Sharing PNL cards
   - Profile updates

---

## Troubleshooting

### Build Fails

- Check Vercel build logs in the dashboard
- Ensure all environment variables are set correctly
- Verify `package.json` has correct build script: `"build": "vite build"`

### Environment Variables Not Working

- Ensure variables start with `VITE_` prefix
- Redeploy after adding environment variables
- Check Vercel dashboard → Settings → Environment Variables

### Firebase Authentication Not Working

- Verify authorized domains in Firebase Console
- Check Firebase config values match your `.env.local`
- Ensure Firebase project is in production mode (not test mode)

### Domain Not Connecting

- Wait 24-48 hours for DNS propagation
- Verify DNS records are correct using `dig` or online DNS checker
- Check Vercel dashboard shows "Valid Configuration"

### Images Not Loading

- Verify Firebase Storage CORS is configured (see `CORS_SETUP.md`)
- Check Firebase Storage security rules allow public read access
- Ensure storage bucket URL is correct in environment variables

---

## Continuous Deployment

Once set up, Vercel will automatically deploy:
- Every push to `main` branch → Production
- Every push to other branches → Preview deployment

You can also trigger manual deployments from the Vercel dashboard.

---

## Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel (preview)
vercel

# Deploy to Vercel (production)
vercel --prod

# View Vercel deployment logs
vercel logs
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- Firebase Hosting (alternative): https://firebase.google.com/docs/hosting

