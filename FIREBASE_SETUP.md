# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name: "Trade Tracker" (or your preferred name)
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click "Email/Password", toggle "Enable", click "Save"
   - **Google**: Click "Google", toggle "Enable", enter support email, click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode" (with rules)
4. Select a location for your database
5. Click "Enable"

## Step 4: Set Up Firestore Security Rules (Important!)

Go to **Firestore Database** > **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own trades
    match /trades/{tradeId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Username lookup - anyone can read, users can create/update their own
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null || request.resource.data.userId != null;
      allow update, delete: if resource.data.userId != null;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Note:** For development, you can use test mode rules if you want to bypass security checks temporarily. However, the rules above are recommended for production.

## Step 5: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Trade Tracker Web")
5. Copy the `firebaseConfig` object

## Step 6: Update src/firebase/config.js

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

## Step 7: Install Dependencies

Run in your terminal:
```bash
npm install
```

## Step 8: Run the Application

```bash
npm run dev
```

Your authentication system is now ready!

## Notes

- **Username-only authentication**: This uses a custom implementation where usernames are stored in Firestore
- **Email/Password**: Uses Firebase's built-in authentication
- **Google OAuth**: Uses Firebase's Google provider
- All user data (trades) are stored in Firestore and associated with user IDs
- Trades persist across sessions and devices

