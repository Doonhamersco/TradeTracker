# Firestore Security Rules for Password Reset Rate Limiting

Add these rules to your Firestore security rules in Firebase Console.

## Collections Needed

1. `passwordResetAttempts` - Tracks reset requests per email address
2. `passwordResetIPAttempts` - Tracks reset requests per IP address
3. `passwordResetLogs` - Audit logs (optional, for monitoring)

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Password Reset Attempts (per email)
    match /passwordResetAttempts/{document} {
      // Allow read/write for authenticated users (client-side rate limiting)
      // In production, consider using Cloud Functions for better security
      allow read, write: if request.auth != null;
      
      // Or restrict to server-side only (more secure):
      // allow read, write: if false; // Only accessible via Admin SDK/Cloud Functions
    }
    
    // Password Reset IP Attempts
    match /passwordResetIPAttempts/{document} {
      allow read, write: if request.auth != null;
      // Or restrict to server-side only:
      // allow read, write: if false;
    }
    
    // Password Reset Logs (audit trail)
    match /passwordResetLogs/{document} {
      // Write-only for clients, read-only for admins
      allow write: if request.auth != null;
      allow read: if false; // Only accessible via Admin SDK/Cloud Functions
    }
  }
}
```

## Alternative: More Secure Server-Side Approach

For better security, use Cloud Functions to handle rate limiting server-side:

1. Create a Cloud Function that:
   - Checks rate limits
   - Records attempts
   - Sends reset email
   - Logs events

2. Client calls the Cloud Function instead of directly accessing Firestore

3. Firestore rules become:
```javascript
match /passwordResetAttempts/{document} {
  allow read, write: if false; // Only accessible via Admin SDK
}
```

## Current Implementation

The current implementation uses client-side rate limiting for simplicity. For production, consider migrating to Cloud Functions for better security.

