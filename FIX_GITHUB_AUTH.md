# Fix GitHub Authentication Error (403)

## ⚠️ IMPORTANT SECURITY WARNING

**You just shared your Personal Access Token publicly!** 

**You MUST revoke this token immediately:**

1. Go to: https://github.com/settings/tokens
2. Find the token: `github_pat_11BXOE6GI0...`
3. Click **"Revoke"** or **"Delete"**
4. Create a NEW token after fixing the issue

---

## Common Causes of 403 Error

### 1. Token Missing Required Scopes
Your token needs the `repo` scope to push code.

### 2. Repository Doesn't Exist
Make sure the repository `TradeTracker` exists on GitHub.

### 3. Token Expired or Revoked
The token might have been revoked or expired.

### 4. Wrong Authentication Method
Sometimes HTTPS authentication can be finicky.

---

## Solutions

### Solution 1: Verify Repository Exists

1. Go to: https://github.com/Doonhamersco/TradeTracker
2. Make sure the repository exists and you have access
3. If it doesn't exist, create it first:
   - Go to: https://github.com/new
   - Name: `TradeTracker`
   - Don't initialize with README
   - Click "Create repository"

### Solution 2: Create New Token with Correct Scopes

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Vercel Deployment - Trade Tracker`
4. Expiration: Choose 90 days or No expiration
5. **Select scopes:**
   - ✅ **`repo`** (Full control of private repositories)
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)

### Solution 3: Use Token Correctly

When pushing, use the token as the password:

```bash
git push -u origin main
```

When prompted:
- **Username**: `Doonhamersco`
- **Password**: Paste your NEW token (not your GitHub password)

### Solution 4: Use SSH Instead (More Secure)

SSH keys are more secure and don't require entering tokens each time.

#### Setup SSH Key:

1. **Check if you have SSH keys:**
   ```bash
   ls -al ~/.ssh
   ```
   Look for `id_rsa.pub` or `id_ed25519.pub`

2. **If no SSH key exists, create one:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   Press Enter to accept default location, then set a passphrase (optional)

3. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   Copy the entire output

4. **Add SSH key to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click **"New SSH key"**
   - Title: `MacBook Air`
   - Key: Paste your public key
   - Click **"Add SSH key"**

5. **Change remote URL to SSH:**
   ```bash
   git remote set-url origin git@github.com:Doonhamersco/TradeTracker.git
   ```

6. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   ```
   Should say: "Hi Doonhamersco! You've successfully authenticated..."

7. **Push using SSH:**
   ```bash
   git push -u origin main
   ```
   No password needed!

---

## Quick Fix (Try This First)

1. **Revoke your old token** (security)
2. **Create a new token** with `repo` scope
3. **Verify repository exists** on GitHub
4. **Try pushing again** with the new token

```bash
git push -u origin main
# Username: Doonhamersco
# Password: [paste NEW token]
```

---

## Still Not Working?

Try these diagnostic commands:

```bash
# Check remote URL
git remote -v

# Verify repository exists (will show 404 if it doesn't)
curl -I https://github.com/Doonhamersco/TradeTracker

# Test authentication
git ls-remote https://github.com/Doonhamersco/TradeTracker.git
```

If `git ls-remote` works, authentication is fine and the issue is elsewhere.
If it fails, the token doesn't have correct permissions.

