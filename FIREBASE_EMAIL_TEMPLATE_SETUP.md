# Firebase Email Template Configuration

## Customize Password Reset Email

Follow these steps to customize the password reset email template in Firebase Console.

### Step 1: Navigate to Email Templates

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **trade-tracker-e8b03**
3. Go to **Authentication** → **Templates** (in the left sidebar)
4. Click on **"Password reset"** template

### Step 2: Customize Email Content

#### Subject Line:
```
Reset your Trade Tracker password
```

#### Email Body (HTML):
```html
Hello,

Use the following link to reset your password for your Trade Tracker account:

%LINK%

If you didn't ask to reset your password, ignore this email.

Thanks,
Doonhamer
```

#### Email Body (Plain Text - if HTML not available):
```
Hello,

Use the following link to reset your password for your Trade Tracker account:

%LINK%

If you didn't ask to reset your password, ignore this email.

Thanks,
Doonhamer
```

### Step 3: Action URL Configuration (CRITICAL)

**This is the most important step!** Firebase will redirect users here after processing the reset link.

In the **Action URL** field, set:
```
https://tradetrack.co.uk/reset-password
```

Or for local development:
```
http://localhost:5173/reset-password
```

**Important Notes:**
- This URL must match your deployed domain (or localhost for dev)
- Firebase will append the action code (`oobCode`) to this URL automatically
- After clicking the reset link, Firebase will briefly show its own page, then redirect to your custom page
- Make sure this URL is accessible and your `/reset-password` route is configured

**To completely avoid Firebase's white page**, you would need to set up Firebase Hosting with custom domain and rewrite rules (more complex setup).

### Step 4: Save Changes

Click **"Save"** to apply the changes.

### Important Notes:

- `%LINK%` is a placeholder that Firebase will replace with the actual reset link
- The link will automatically include the reset token and redirect to your specified URL
- You can use HTML formatting if your Firebase plan supports it
- Test the email by requesting a password reset after saving

### Testing:

1. Save the template
2. Request a password reset from your app
3. Check your email inbox
4. Verify the email content matches your template
5. Click the link to ensure it redirects correctly

### Current Email Template Variables:

Firebase provides these variables you can use:
- `%LINK%` - The password reset link
- `%EMAIL%` - User's email address
- `%APP_NAME%` - Your app name (if configured)

### Troubleshooting:

- **Email not updating**: Clear browser cache and refresh Firebase Console
- **Link not working**: Verify Action URL is correct and accessible
- **Email going to spam**: Check SPF/DKIM records for your Firebase domain

