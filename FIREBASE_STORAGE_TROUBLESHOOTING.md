# Firebase Storage Troubleshooting Checklist

## Critical Configurations to Check in Firebase Console

### 1. **Storage Security Rules** (Most Important!)

Go to: **Firebase Console > Storage > Rules**

**Current rules should be:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/pnl-backgrounds/{fileName} {
      // Allow read for authenticated users who own the file
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write for authenticated users who own the file
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**⚠️ CRITICAL CHECKS:**
- [ ] Rules are **Published** (not just saved as draft)
- [ ] Rules match the exact path: `users/{userId}/pnl-backgrounds/{fileName}`
- [ ] `request.auth != null` is checking for authenticated users
- [ ] For username-only auth, you might need to adjust rules (see below)

**For Username-Only Authentication:**
If you're using username-only auth (not Firebase Auth), the rules above won't work because `request.auth` will be null. You need:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/pnl-backgrounds/{fileName} {
      // Allow read for any authenticated user (Firebase Auth)
      // OR allow if the path matches a valid user ID pattern
      allow read: if request.auth != null && request.auth.uid == userId
                  || resource != null; // Fallback for username auth
      
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**Temporary Test Rules (Development Only):**
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
⚠️ **WARNING**: This allows any authenticated user to read/write any file. Only use for testing!

---

### 2. **Storage Bucket Configuration**

Go to: **Firebase Console > Storage > Files**

**Check:**
- [ ] Storage is **enabled** (not just initialized)
- [ ] Files are actually uploaded (check `users/{your-user-id}/pnl-backgrounds/`)
- [ ] File URLs are accessible (click on a file and check if you can view it)
- [ ] File size is under 5MB
- [ ] File type is an image (PNG, JPG, etc.)

---

### 3. **Storage CORS Configuration**

Firebase Storage doesn't have a separate CORS configuration in the console. CORS is handled through:
- Security rules (above)
- Using `getDownloadURL()` which returns signed URLs
- Proper authentication tokens

**However, you can set CORS via gsutil (Google Cloud SDK):**

If you have `gsutil` installed, you can set CORS:

```bash
gsutil cors set cors.json gs://trade-tracker-e8b03.firebasestorage.app
```

Create a `cors.json` file:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

**⚠️ Note**: This allows all origins. For production, specify your domain:
```json
[
  {
    "origin": ["http://localhost:5173", "https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

---

### 4. **Authentication Status**

Go to: **Firebase Console > Authentication > Users**

**Check:**
- [ ] Your user account exists
- [ ] User is properly authenticated
- [ ] User ID matches the path in Storage (`users/{userId}/pnl-backgrounds/`)

**For Username-Only Auth:**
- [ ] Check that your custom user ID is being used correctly
- [ ] Verify the user ID in Firestore matches the Storage path

---

### 5. **Network Tab Debugging**

Open browser DevTools (F12) > Network tab:

**When loading the image, check:**
- [ ] Request URL (should be Firebase Storage URL)
- [ ] Request Method (should be GET)
- [ ] Response Status (should be 200, not 403 or 404)
- [ ] Response Headers (check for CORS headers)
- [ ] Error messages in Console tab

**Common Errors:**
- **403 Forbidden**: Security rules are blocking access
- **404 Not Found**: File doesn't exist at that path
- **CORS error**: Need to set CORS or use data URL conversion
- **401 Unauthorized**: Authentication token missing/invalid

---

### 6. **Code-Level Checks**

In your code, verify:

1. **Storage initialization:**
```javascript
// In src/firebase/config.js
import { getStorage } from 'firebase/storage'
export const storage = getStorage(app)
```

2. **Using getDownloadURL() instead of direct URLs:**
```javascript
// ✅ CORRECT - Gets signed URL
const storageRef = ref(storage, `users/${userId}/pnl-backgrounds/${fileName}`)
const downloadURL = await getDownloadURL(storageRef)

// ❌ WRONG - Direct URL might have CORS issues
const directURL = `https://firebasestorage.googleapis.com/...`
```

3. **Converting to data URL (current approach):**
```javascript
// Fetch as blob and convert to data URL
const response = await fetch(downloadURL)
const blob = await response.blob()
const dataUrl = await new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onloadend = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(blob)
})
```

---

### 7. **Quick Test**

**Test if Storage is accessible:**

1. Go to Firebase Console > Storage > Files
2. Navigate to `users/{your-user-id}/pnl-backgrounds/`
3. Click on an uploaded file
4. Copy the "Download URL"
5. Open in a new browser tab (incognito/private window)
6. If it loads → Storage is working, issue is in code
7. If it doesn't load → Storage rules or CORS issue

---

### 8. **Recommended Solution**

Based on the persistent issues, I recommend:

**Option A: Use Firebase Storage SDK properly**
- Always use `getDownloadURL()` to get signed URLs
- These URLs should work without CORS issues
- Convert to data URL only if needed for canvas

**Option B: Use a proxy/server endpoint**
- Create a server endpoint that fetches the image
- Server has no CORS restrictions
- Returns image data directly

**Option C: Store images as base64 in Firestore**
- Convert images to base64 strings
- Store in Firestore document
- No CORS issues, but larger document size

---

## Next Steps

1. **Check Storage Rules** - Most likely issue
2. **Verify files exist** in Storage
3. **Test direct URL access** in browser
4. **Check browser console** for specific errors
5. **Try the test rules** temporarily to isolate the issue

Let me know what you find and we can fix the specific issue!

