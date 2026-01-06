# Deployment Checklist: tradetrack.co.uk

Print this checklist and check off each item as you complete it.

---

## ✅ Pre-Deployment

- [ ] Git repository initialized (`git init` done)
- [ ] Code committed (`git commit` done)
- [ ] GitHub account created/accessible
- [ ] Vercel account created/accessible
- [ ] Domain `tradetrack.co.uk` purchased and accessible

---

## ✅ Step 1: GitHub Setup

- [ ] Created new repository on GitHub: `trade-tracker`
- [ ] Copied repository URL: `https://github.com/YOUR_USERNAME/trade-tracker.git`
- [ ] Added GitHub remote: `git remote add origin [URL]`
- [ ] Pushed code to GitHub: `git push -u origin main`
- [ ] Verified files appear on GitHub (check repository page)

---

## ✅ Step 2: Vercel Import

- [ ] Logged into Vercel Dashboard
- [ ] Clicked "Add New..." → "Project"
- [ ] Connected GitHub account (if first time)
- [ ] Selected repository: `trade-tracker`
- [ ] Verified auto-detected settings:
  - [ ] Framework: Vite ✅
  - [ ] Build Command: `npm run build` ✅
  - [ ] Output Directory: `dist` ✅
- [ ] Clicked "Deploy"
- [ ] First deployment completed (may show errors - that's OK)

---

## ✅ Step 3: Environment Variables

Added all 7 environment variables in Vercel (Settings → Environment Variables):

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID`

**For each variable:**
- [ ] Value copied correctly from `.env.local`
- [ ] Checked ✅ Production
- [ ] Checked ✅ Preview
- [ ] Checked ✅ Development
- [ ] Clicked "Save"

- [ ] Redeployed project (Deployments → ... → Redeploy)

---

## ✅ Step 4: Domain Configuration

- [ ] Added domain in Vercel: Settings → Domains → `tradetrack.co.uk`
- [ ] Chose DNS method:
  - [ ] Option A: Vercel Nameservers (easier)
  - [ ] Option B: A/CNAME Records

**If using Nameservers:**
- [ ] Copied 4 nameservers from Vercel
- [ ] Logged into domain registrar
- [ ] Replaced nameservers
- [ ] Saved changes

**If using DNS Records:**
- [ ] Added A record for `tradetrack.co.uk` (IP: check Vercel)
- [ ] Added CNAME record for `www.tradetrack.co.uk`
- [ ] Saved DNS changes

- [ ] Waiting for DNS propagation (24-48 hours)
- [ ] Vercel shows: ✅ "Valid Configuration"

---

## ✅ Step 5: Firebase Configuration

- [ ] Logged into Firebase Console
- [ ] Selected project: `trade-tracker-e8b03`
- [ ] Went to: Authentication → Settings → Authorized domains
- [ ] Added domain: `tradetrack.co.uk`
- [ ] Added domain: `www.tradetrack.co.uk`
- [ ] Added domain: `your-app.vercel.app` (Vercel preview URL)

---

## ✅ Step 6: Testing

Visit `https://tradetrack.co.uk` and test:

- [ ] Landing page loads correctly
- [ ] Background video plays (on desktop)
- [ ] Character image displays
- [ ] "Get Started" button works
- [ ] User registration works
- [ ] User login works
- [ ] Add trade form works
- [ ] Trade history table displays
- [ ] Column sorting works
- [ ] Edit trade works
- [ ] Delete trade works
- [ ] PNL page displays correctly
- [ ] Profile modal opens
- [ ] Display name editing works
- [ ] Image upload works (PNL backgrounds)
- [ ] Share PNL works
- [ ] Download PNL image works
- [ ] Copy PNL image works
- [ ] No console errors (check DevTools)

---

## ✅ Step 7: Post-Deployment

- [ ] Tested on mobile device
- [ ] Tested on different browsers (Chrome, Safari, Firefox)
- [ ] Verified HTTPS is working (🔒 lock icon)
- [ ] Checked page load speed
- [ ] Verified all images load correctly
- [ ] Tested Firebase Storage uploads
- [ ] Verified Firebase Authentication works

---

## 🎉 Deployment Complete!

Your app is live at: **https://tradetrack.co.uk**

---

## 📝 Notes

**Repository URL:** _________________________________

**Vercel Project URL:** _________________________________

**Vercel Preview URL:** _________________________________

**Domain Registrar:** _________________________________

**DNS Method Used:** _________________________________

---

## 🔄 Future Updates

To deploy updates:
```bash
git add .
git commit -m "Description of changes"
git push
```
Vercel automatically deploys! 🚀

---

## 📚 Reference Documents

- **Quick Guide**: `DEPLOYMENT_STEPS.md`
- **Detailed Guide**: `GITHUB_DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: See `GITHUB_DEPLOYMENT_GUIDE.md` → Troubleshooting section

