# Detailed GitHub Deployment Guide for tradetrack.co.uk

This guide walks you through deploying your Trade Tracker app to Vercel via GitHub integration.

---

## Prerequisites

- GitHub account (create one at https://github.com if needed)
- Vercel account (create one at https://vercel.com/signup if needed)
- Git installed on your computer (check with `git --version`)

---

## Step 1: Initialize Git Repository (if not already done)

### Check if Git is initialized:

```bash
cd "/Users/doonhamer/FIB TRACKER"
git status
```

### If you see "not a git repository", initialize it:

```bash
# Initialize git repository
git init

# Add all files (except those in .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Trade Tracker app ready for deployment"
```

### If Git is already initialized, just add and commit any new changes:

```bash
git add .
git commit -m "Prepare for deployment: Add environment variables and Vercel config"
```

---

## Step 2: Create GitHub Repository

### 2.1. Go to GitHub

1. Open your browser and go to: **https://github.com**
2. Log in to your GitHub account

### 2.2. Create New Repository

1. Click the **"+"** icon in the top right corner
2. Select **"New repository"** from the dropdown

### 2.3. Repository Settings

Fill in the form:

- **Repository name**: `trade-tracker` (or any name you prefer)
- **Description**: `Trade Tracker by Doonhamer - Manual trade tracking application`
- **Visibility**: 
  - Choose **Private** (recommended) - Only you can see the code
  - Or **Public** - Anyone can see the code
- **DO NOT** check:
  - ❌ "Add a README file" (you already have files)
  - ❌ "Add .gitignore" (you already have one)
  - ❌ "Choose a license" (optional, skip for now)

4. Click **"Create repository"** button

### 2.4. Copy Repository URL

After creating the repository, GitHub will show you a page with setup instructions. You'll see a URL like:
- `https://github.com/YOUR_USERNAME/trade-tracker.git`

**Copy this URL** - you'll need it in the next step.

---

## Step 3: Connect Local Repository to GitHub

### 3.1. Add GitHub as Remote

Open your terminal in the project directory and run:

```bash
cd "/Users/doonhamer/FIB TRACKER"

# Replace YOUR_USERNAME and trade-tracker with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/trade-tracker.git
```

**Example** (if your username is `doonhamer`):
```bash
git remote add origin https://github.com/doonhamer/trade-tracker.git
```

### 3.2. Rename Branch to Main (if needed)

```bash
git branch -M main
```

### 3.3. Push Code to GitHub

```bash
git push -u origin main
```

**If prompted for authentication:**
- **Username**: Your GitHub username
- **Password**: You'll need a **Personal Access Token** (not your GitHub password)

### 3.4. Create Personal Access Token (if needed)

If GitHub asks for a password/token:

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Vercel Deployment`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

### 3.5. Verify Push Success

After pushing, refresh your GitHub repository page. You should see all your files there:
- `src/` folder
- `public/` folder
- `package.json`
- `vercel.json`
- `.env.example`
- etc.

**Important**: Make sure `.env.local` is NOT visible (it should be gitignored)

---

## Step 4: Import Repository to Vercel

### 4.1. Go to Vercel Dashboard

1. Open: **https://vercel.com**
2. Log in (or sign up if you don't have an account)
3. You'll be taken to your dashboard

### 4.2. Import Project

1. Click the **"Add New..."** button (top right)
2. Select **"Project"** from the dropdown

### 4.3. Import Git Repository

1. You'll see a list of Git providers (GitHub, GitLab, Bitbucket)
2. Click **"Import"** next to **GitHub** (or connect GitHub if not already connected)
3. If connecting GitHub for the first time:
   - Click **"Connect GitHub"**
   - Authorize Vercel to access your repositories
   - You may need to enter your GitHub password or use 2FA

### 4.4. Select Repository

1. You'll see a list of your GitHub repositories
2. Find and click on **"trade-tracker"** (or whatever you named it)
3. Click **"Import"**

### 4.5. Configure Project

Vercel will auto-detect your project settings. Verify these:

**Framework Preset**: 
- Should show: **"Vite"** ✅
- If not, select it from the dropdown

**Root Directory**: 
- Should be: `./` ✅
- Leave as default

**Build Command**: 
- Should be: `npm run build` ✅
- This is auto-detected from your `package.json`

**Output Directory**: 
- Should be: `dist` ✅
- This is auto-detected from your `vercel.json`

**Install Command**: 
- Should be: `npm install` ✅
- Leave as default

**Environment Variables**: 
- ⚠️ **DON'T ADD THEM YET** - We'll do this after the first deployment

### 4.6. Deploy

1. Click the **"Deploy"** button (bottom right)
2. Vercel will start building your project
3. You'll see a build log in real-time
4. **The first deployment will fail** because environment variables are missing - that's expected!

---

## Step 5: Add Environment Variables in Vercel

### 5.1. Navigate to Project Settings

1. After the first deployment completes (even if it failed), click on your project name
2. Go to **"Settings"** tab (top navigation)
3. Click **"Environment Variables"** in the left sidebar

### 5.2. Add Each Environment Variable

You need to add 7 environment variables. For each one:

1. Click **"Add New"** button
2. Enter the **Key** (name)
3. Enter the **Value** (from your `.env.local` file)
4. Select environments: ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **"Save"**

**Add these 7 variables:**

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyC3opD6kMJtmjK1jc_uj9EPw0Ug17J9-Uk` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trade-tracker-e8b03.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `trade-tracker-e8b03` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trade-tracker-e8b03.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `728587125120` |
| `VITE_FIREBASE_APP_ID` | `1:728587125120:web:5127357c25cd064823c165` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-0B8NJV4NFS` |

**Important**: 
- Make sure to check all three environments (Production, Preview, Development)
- Double-check each value is correct (copy from your `.env.local` file)

### 5.3. Redeploy with Environment Variables

After adding all environment variables:

1. Go to the **"Deployments"** tab (top navigation)
2. Find the latest deployment (or the failed one)
3. Click the **"..."** (three dots) menu on the right
4. Click **"Redeploy"**
5. Confirm by clicking **"Redeploy"** again

**OR** simply push a new commit to trigger a new deployment:

```bash
git commit --allow-empty -m "Trigger redeploy with environment variables"
git push
```

Vercel will automatically deploy when you push to GitHub!

---

## Step 6: Connect Custom Domain (tradetrack.co.uk)

### 6.1. Navigate to Domains Settings

1. In your Vercel project, go to **"Settings"** tab
2. Click **"Domains"** in the left sidebar

### 6.2. Add Domain

1. In the **"Domains"** section, you'll see an input field
2. Enter: `tradetrack.co.uk`
3. Click **"Add"** button

### 6.3. Configure DNS Records

Vercel will show you DNS configuration instructions. You have two options:

#### Option A: Use Vercel Nameservers (Easier - Recommended)

1. **Copy the nameservers** shown in Vercel (usually 4 nameservers like `ns1.vercel-dns.com`)
2. Go to your domain registrar (where you bought tradetrack.co.uk)
3. Find **DNS Settings** or **Nameservers** section
4. Replace existing nameservers with Vercel's nameservers
5. Save changes

**Popular registrars:**
- **Namecheap**: Domain List → Manage → Nameservers → Custom DNS
- **GoDaddy**: My Products → DNS → Nameservers
- **Google Domains**: DNS → Name servers
- **Cloudflare**: DNS → Nameservers

#### Option B: Use A/CNAME Records (More Control)

If you prefer to keep your current nameservers:

1. **For Root Domain (tradetrack.co.uk)**:
   - **Type**: `A`
   - **Name**: `@` (or leave blank)
   - **Value**: `76.76.21.21` (check Vercel dashboard for current IP - it may change)

2. **For WWW Subdomain (www.tradetrack.co.uk)**:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com` (or the value shown in Vercel)

Add these records in your domain registrar's DNS settings.

### 6.4. Wait for DNS Propagation

- DNS changes can take **24-48 hours** to propagate globally
- Vercel will show the status:
  - ⏳ **"Pending"** - DNS is propagating
  - ✅ **"Valid Configuration"** - Domain is connected and working
- You can check status using:
  - Vercel dashboard (shows real-time status)
  - Online tools: `https://dnschecker.org` or `https://www.whatsmydns.net`

### 6.5. Verify Domain Connection

Once Vercel shows "Valid Configuration":

1. Visit `https://tradetrack.co.uk` in your browser
2. You should see your Trade Tracker app!
3. Also test `https://www.tradetrack.co.uk` (should redirect or work the same)

---

## Step 7: Update Firebase Authorized Domains

Your app won't work fully until Firebase knows about your custom domain.

### 7.1. Go to Firebase Console

1. Open: **https://console.firebase.google.com/**
2. Select your project: **trade-tracker-e8b03**

### 7.2. Add Authorized Domains

1. Go to **"Authentication"** in the left sidebar
2. Click **"Settings"** tab
3. Scroll down to **"Authorized domains"** section
4. Click **"Add domain"** button
5. Add these domains one by one:
   - `tradetrack.co.uk`
   - `www.tradetrack.co.uk`
   - `your-app-name.vercel.app` (your Vercel preview URL - shown in Vercel dashboard)

6. Click **"Add"** for each domain

### 7.3. Verify Firebase Configuration

Firebase should now allow authentication from your custom domain. Test it:
1. Visit `https://tradetrack.co.uk`
2. Try to sign up or log in
3. It should work! ✅

---

## Step 8: Test Your Deployment

### 8.1. Test All Features

Visit `https://tradetrack.co.uk` and test:

- ✅ **Landing Page** - Should load with character and video background
- ✅ **User Registration** - Create a new account
- ✅ **User Login** - Log in with your account
- ✅ **Add Trade** - Add a new trade entry
- ✅ **Trade History** - View your trades in the table
- ✅ **PNL Page** - View PNL analytics
- ✅ **Profile** - Update display name
- ✅ **Image Upload** - Upload PNL card backgrounds
- ✅ **Share PNL** - Generate and share PNL cards
- ✅ **Download/Copy** - Export PNL cards as images

### 8.2. Check Console for Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any red errors
4. Check **Network** tab for failed requests

---

## Step 9: Set Up Automatic Deployments (Already Done!)

Vercel automatically deploys when you push to GitHub:

- **Push to `main` branch** → Deploys to **Production** (tradetrack.co.uk)
- **Push to other branches** → Creates **Preview** deployment (unique URL)

### How to Deploy Updates:

```bash
# Make your changes locally
# ... edit files ...

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push

# Vercel automatically builds and deploys! 🚀
```

You can see deployment status in:
- Vercel Dashboard → Deployments tab
- GitHub repository → Actions tab (if GitHub Actions are enabled)

---

## Troubleshooting

### Build Fails in Vercel

**Error**: "Missing environment variables"
- **Solution**: Make sure all 7 environment variables are added in Vercel Settings → Environment Variables

**Error**: "Module not found"
- **Solution**: Check that `package.json` has all dependencies. Run `npm install` locally to verify.

**Error**: "Build command failed"
- **Solution**: Check Vercel build logs. Click on the failed deployment to see detailed error messages.

### Domain Not Connecting

**Status**: "Pending" for more than 48 hours
- **Solution**: 
  - Verify DNS records are correct using `dig tradetrack.co.uk`
  - Check that nameservers/DNS records are saved correctly in your registrar
  - Contact your domain registrar support

**Status**: "Invalid Configuration"
- **Solution**: 
  - Check DNS records match exactly what Vercel shows
  - Make sure you're using the correct IP address (Vercel may update it)

### Firebase Authentication Not Working

**Error**: "auth/unauthorized-domain"
- **Solution**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

**Error**: "Firebase config missing"
- **Solution**: Verify all environment variables are set correctly in Vercel

### Images Not Loading

**Error**: CORS errors in console
- **Solution**: Make sure Firebase Storage CORS is configured (see `CORS_SETUP.md`)

**Error**: Images not appearing
- **Solution**: Check Firebase Storage security rules allow read access

---

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub**: https://github.com
- **Firebase Console**: https://console.firebase.google.com/
- **Vercel Docs**: https://vercel.com/docs
- **Git Docs**: https://git-scm.com/doc

---

## Summary Checklist

- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Repository imported to Vercel
- [ ] First deployment completed (may fail without env vars)
- [ ] All 7 environment variables added in Vercel
- [ ] Project redeployed with environment variables
- [ ] Domain `tradetrack.co.uk` added in Vercel
- [ ] DNS records configured at domain registrar
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] Firebase authorized domains updated
- [ ] App tested and working at `https://tradetrack.co.uk`

---

**Congratulations!** 🎉 Your Trade Tracker app should now be live at `https://tradetrack.co.uk`!

