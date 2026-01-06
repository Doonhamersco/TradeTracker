# Quick Visual Guide: Deploy to tradetrack.co.uk via GitHub

## 🎯 Overview
This is a condensed visual guide. For detailed instructions, see `GITHUB_DEPLOYMENT_GUIDE.md`.

---

## Step 1: Prepare Git Repository ✅

**Run this command in your terminal:**

```bash
cd "/Users/doonhamer/FIB TRACKER"
./setup-github.sh
```

**Or manually:**
```bash
git init
git add .
git commit -m "Initial commit: Trade Tracker app ready for deployment"
git branch -M main
```

---

## Step 2: Create GitHub Repository 🌐

### 2.1 Go to GitHub
👉 **https://github.com** → Click **"+"** → **"New repository"**

### 2.2 Fill in the form:
```
Repository name: trade-tracker
Description: Trade Tracker by Doonhamer
Visibility: Private (recommended)
❌ Don't check any boxes (README, .gitignore, license)
```

### 2.3 Click **"Create repository"**

### 2.4 Copy the repository URL
You'll see: `https://github.com/YOUR_USERNAME/trade-tracker.git`
**Copy this URL!**

---

## Step 3: Push Code to GitHub 📤

**In your terminal, run (replace YOUR_USERNAME):**

```bash
git remote add origin https://github.com/YOUR_USERNAME/trade-tracker.git
git push -u origin main
```

**If asked for authentication:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)

### Create Personal Access Token:
1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Vercel Deployment`
4. Check: ✅ `repo`
5. Click **"Generate token"**
6. **Copy the token** and use it as your password

---

## Step 4: Import to Vercel 🚀

### 4.1 Go to Vercel
👉 **https://vercel.com** → Click **"Add New..."** → **"Project"**

### 4.2 Connect GitHub
- Click **"Import"** next to GitHub
- Authorize Vercel (if first time)

### 4.3 Select Repository
- Find **"trade-tracker"** in the list
- Click **"Import"**

### 4.4 Configure (Auto-detected - just verify):
```
Framework Preset: Vite ✅
Root Directory: ./ ✅
Build Command: npm run build ✅
Output Directory: dist ✅
```

### 4.5 Click **"Deploy"**
⚠️ First deployment will fail (no env vars yet) - that's OK!

---

## Step 5: Add Environment Variables 🔐

### 5.1 Go to Settings
In Vercel Dashboard → Your Project → **"Settings"** → **"Environment Variables"**

### 5.2 Add these 7 variables (one by one):

Click **"Add New"** for each:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyC3opD6kMJtmjK1jc_uj9EPw0Ug17J9-Uk` | ✅ All |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trade-tracker-e8b03.firebaseapp.com` | ✅ All |
| `VITE_FIREBASE_PROJECT_ID` | `trade-tracker-e8b03` | ✅ All |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trade-tracker-e8b03.firebasestorage.app` | ✅ All |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `728587125120` | ✅ All |
| `VITE_FIREBASE_APP_ID` | `1:728587125120:web:5127357c25cd064823c165` | ✅ All |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-0B8NJV4NFS` | ✅ All |

**Important:** Check ✅ Production, ✅ Preview, ✅ Development for each

### 5.3 Redeploy
- Go to **"Deployments"** tab
- Click **"..."** on latest deployment → **"Redeploy"**

---

## Step 6: Connect Domain 🌍

### 6.1 Add Domain in Vercel
Settings → **"Domains"** → Enter: `tradetrack.co.uk` → Click **"Add"**

### 6.2 Configure DNS (Choose ONE method):

#### Method A: Use Vercel Nameservers (Easier) ⭐
1. Copy nameservers from Vercel (usually 4 like `ns1.vercel-dns.com`)
2. Go to your domain registrar
3. Replace nameservers with Vercel's
4. Save

#### Method B: Use DNS Records
Add these records in your registrar:

**For tradetrack.co.uk:**
- Type: `A`
- Name: `@` (or blank)
- Value: `76.76.21.21` (check Vercel for current IP)

**For www.tradetrack.co.uk:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### 6.3 Wait for DNS
- Takes 24-48 hours
- Vercel will show: ✅ "Valid Configuration" when ready

---

## Step 7: Update Firebase 🔥

### 7.1 Go to Firebase Console
👉 **https://console.firebase.google.com/** → Select project: **trade-tracker-e8b03**

### 7.2 Add Authorized Domains
Authentication → Settings → **"Authorized domains"** → **"Add domain"**

Add these:
- `tradetrack.co.uk`
- `www.tradetrack.co.uk`
- `your-app.vercel.app` (your Vercel URL)

---

## Step 8: Test ✅

Visit: **https://tradetrack.co.uk**

Test:
- ✅ Landing page loads
- ✅ Sign up / Login works
- ✅ Add trade works
- ✅ Images upload
- ✅ PNL sharing works

---

## 🎉 Done!

Your app is now live at **https://tradetrack.co.uk**

### Future Updates:
```bash
git add .
git commit -m "Your changes"
git push
```
Vercel automatically deploys! 🚀

---

## 📚 Need More Details?
See `GITHUB_DEPLOYMENT_GUIDE.md` for comprehensive instructions.

