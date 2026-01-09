# Custom Password Reset Page Setup

## Overview

The app now uses a custom password reset page that matches the dark theme of the main application, instead of Firebase's default white reset page.

## How It Works

1. User requests password reset from login page
2. Firebase sends email with reset link
3. User clicks link in email
4. Firebase action handler processes the code
5. User is redirected to `/reset-password` with action code
6. Custom reset page verifies code and shows password reset form
7. User enters new password
8. Password is reset and user is redirected to login

## Configuration

### 1. Email Template (Firebase Console)

The email template is already configured to use the custom reset page via the `sendPasswordResetEmail` function:

```javascript
await sendPasswordResetEmail(auth, email, {
  url: window.location.origin + '/reset-password',
  handleCodeInApp: true
})
```

### 2. Route Configuration

The route `/reset-password` is already configured in `App.jsx`:

```javascript
<Route 
  path="/reset-password" 
  element={<ResetPasswordPage />} 
/>
```

### 3. Email Template Content

Update the email template in Firebase Console to match your branding:

**Subject**: `Reset your Trade Tracker password`

**Body**:
```
Hello,

Use the following link to reset your password for your Trade Tracker account:

%LINK%

If you didn't ask to reset your password, ignore this email.

Thanks,
Doonhamer
```

**Action URL**: `https://tradetrack.co.uk/reset-password` (or your domain)

## Testing

1. Request a password reset from the login page
2. Check your email for the reset link
3. Click the link
4. You should be redirected to the custom reset page (dark theme)
5. Enter new password and confirm
6. Password should be reset and you'll be redirected to login

## Troubleshooting

### Reset link shows Firebase's default page

- Check that `handleCodeInApp: true` is set in `passwordResetService.js`
- Verify the `url` parameter points to `/reset-password`
- Clear browser cache and try again

### Action code not found error

- Check that the URL contains `oobCode` query parameter
- Verify the code hasn't expired (1 hour limit)
- Try requesting a new reset link

### Page doesn't match app theme

- Verify `ResetPasswordPage.jsx` uses the same styling classes as `Auth.jsx`
- Check that `BackgroundVideo` component is rendered in `App.jsx`
- Ensure Tailwind CSS is properly configured

## Files

- `src/pages/ResetPasswordPage.jsx` - Custom reset page component
- `src/services/passwordResetService.js` - Password reset service
- `src/App.jsx` - Route configuration
- `FIREBASE_EMAIL_TEMPLATE_SETUP.md` - Email template setup guide

