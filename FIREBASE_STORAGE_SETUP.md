# Firebase Storage Setup Instructions

## Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (trade-tracker-e8b03)
3. In the left sidebar, click on **Storage**
4. Click **Get started**
5. Choose **Start in test mode** (for development) or **Start in production mode** (with rules)
6. Select a location for your storage (choose the same location as your Firestore database if possible)
7. Click **Done**

## Step 2: Set Up Storage Security Rules

Go to **Storage** > **Rules** and paste the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload/read/delete their own images
    match /users/{userId}/pnl-backgrounds/{fileName} {
      // Allow read if user is authenticated and owns the file
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write (upload/delete) if user is authenticated and owns the file
      // Note: request.resource is only available for create/update, not for delete
      allow create: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Only images
      
      allow update: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Only images
      
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Alternative (Simpler - for testing):**

If the above doesn't work, try this simpler version for testing:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/pnl-backgrounds/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Important Notes:**
- These rules ensure users can only access their own background images
- File size is limited to 5MB
- Only image files are allowed
- Click **Publish** to save the rules

## Step 3: Verify Storage is Working

After setting up the rules, try uploading an image again. You should see:
- Upload progress percentage
- Success message when complete
- Preview thumbnail appears

## Troubleshooting

### Upload Stuck or Failing

1. **Check Browser Console**: Open Developer Tools (F12) and check the Console tab for error messages
2. **Check Storage Rules**: Make sure the rules are published and match the pattern above
3. **Check File Size**: Ensure your image is less than 5MB
4. **Check File Type**: Only image files (PNG, JPG, etc.) are allowed
5. **Check Authentication**: Make sure you're logged in

### Common Error Messages

- **"Storage access denied"**: Check that Storage rules are set up correctly
- **"File too large"**: Reduce image size (compress or resize)
- **"Invalid file type"**: Make sure you're uploading an image file
- **"Network error"**: Check your internet connection

### Testing Storage Access

1. Go to Firebase Console > Storage
2. You should see a folder structure: `users/{your-user-id}/pnl-backgrounds/`
3. If you see files there, the upload worked but the profile update might have failed
4. Check the browser console for any Firestore update errors

## Alternative: Test Mode (Development Only)

If you want to test quickly without setting up rules, you can temporarily use test mode:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: This allows any authenticated user to read/write any file. Only use for development!

