# Firebase Storage CORS Configuration

The issue is that Firebase Storage bucket needs CORS headers configured. Even though your security rules allow read access, the browser blocks the requests due to missing CORS headers.

## Solution: Configure CORS on Firebase Storage Bucket

### Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project trade-tracker-e8b03
   ```

4. **Create a CORS configuration file**:
   Create a file named `cors.json` in your project root:
   ```json
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
       "method": ["GET", "HEAD", "OPTIONS"],
       "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

   **For production, add your actual domain:**
   ```json
   [
     {
       "origin": [
         "http://localhost:5173",
         "http://localhost:3000",
         "https://yourdomain.com",
         "https://www.yourdomain.com"
       ],
       "method": ["GET", "HEAD", "OPTIONS"],
       "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Authorization"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

5. **Apply CORS configuration to your Storage bucket**:
   ```bash
   gsutil cors set cors.json gs://trade-tracker-e8b03.firebasestorage.app
   ```

6. **Verify CORS is set**:
   ```bash
   gsutil cors get gs://trade-tracker-e8b03.firebasestorage.app
   ```

### Option 2: Using Firebase Console (Limited)

Firebase Console doesn't have a direct CORS configuration UI, so you'll need to use gsutil (Option 1) or the Google Cloud Console.

### Option 3: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `trade-tracker-e8b03`
3. Go to **Cloud Storage** > **Buckets**
4. Click on your bucket: `trade-tracker-e8b03.firebasestorage.app`
5. Go to **Configuration** tab
6. Scroll to **CORS configuration**
7. Click **Edit CORS configuration**
8. Paste the CORS configuration JSON (same as above)
9. Click **Save**

## After Configuring CORS

1. **Clear browser cache** (important!)
2. **Refresh the page**
3. **Try loading the PNL card again**

The CORS errors should be gone, and `getBytes()` should work properly.

## Troubleshooting

If CORS is still not working:

1. **Check the bucket name**: Make sure you're using the correct bucket name
   - Your bucket: `trade-tracker-e8b03.firebasestorage.app`
   - Check in Firebase Console > Storage > Files (look at the URL)

2. **Verify CORS is applied**:
   ```bash
   gsutil cors get gs://trade-tracker-e8b03.firebasestorage.app
   ```

3. **Check browser console** - you should see the requests going through without CORS errors

4. **Try a different origin** - if localhost doesn't work, try adding your exact origin

## Alternative: Use a Proxy (If CORS Can't Be Configured)

If you can't configure CORS, you could create a server-side proxy endpoint that fetches the image and serves it to your frontend. But configuring CORS is the proper solution.

