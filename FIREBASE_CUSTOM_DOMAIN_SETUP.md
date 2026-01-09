# Firebase Custom Domain Setup for Password Reset

## Problem

Firebase's default action handler (`/_/auth/action`) shows a white page that doesn't match your app's dark theme. To use your custom reset page, you need to configure Firebase to redirect to your domain.

## Solution: Configure Firebase Email Template Action URL

### Step 1: Update Email Template in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **trade-tracker-e8b03**
3. Go to **Authentication** → **Templates**
4. Click on **"Password reset"** template
5. In the **Action URL** field, enter:
   ```
   https://tradetrack.co.uk/reset-password
   ```
   (Or `http://localhost:5173/reset-password` for local development)

6. Click **"Save"**

### Step 2: Update Code Configuration

The code is already configured to use `handleCodeInApp: false`, which means Firebase will redirect to your custom URL after processing the action.

### Step 3: How It Works

1. User clicks reset link in email
2. Link goes to Firebase's action handler: `firebaseapp.com/_/auth/action?mode=resetPassword&oobCode=...`
3. Firebase processes the action code
4. Firebase redirects to your Action URL: `tradetrack.co.uk/reset-password?mode=resetPassword&oobCode=...`
5. Your custom `ResetPasswordPage` handles the reset

## Alternative: Custom Domain with Firebase Hosting

If you want to completely bypass Firebase's action handler, you can:

1. Set up Firebase Hosting on your custom domain
2. Configure rewrite rules to handle `/_/auth/action` routes
3. Redirect to your React app

However, this is more complex and requires Firebase Hosting setup.

## Current Implementation

The current code uses:
- `handleCodeInApp: false` - Firebase redirects after action
- Custom `ResetPasswordPage` component - Matches your app's dark theme
- Route `/reset-password` - Handles the reset flow

## Testing

After updating the Action URL in Firebase Console:

1. Request a password reset
2. Click the link in the email
3. You should be redirected to your custom dark-themed reset page
4. Enter new password and reset

## Troubleshooting

**Still seeing Firebase's white page?**
- Check that Action URL is set correctly in Firebase Console
- Clear browser cache
- Try requesting a new reset link
- Verify the URL in the email points to your domain

**Action code not found?**
- Check that the `oobCode` parameter is in the URL
- Verify the code hasn't expired (1 hour limit)
- Check browser console for errors

