# Trade Tracker by Doonhamer

A modern, single-page React application for tracking Solana trades with automatic profit/loss calculations, user authentication, and cloud storage.

## Features

- **User Authentication**: Multiple login methods (Google OAuth, Email/Password, Username-only)
- **Trade Input Form**: Add trades with Coin Name, Entry Size, Exit Size, and Category
- **Automatic Calculations**: Real-time profit/loss in USD and percentage
- **Profit Celebration**: Animated dollar bills when you make a profit! 💵
- **Trade History**: View all trades in a clean table format
- **CRUD Operations**: Create, Read, Update, and Delete trades
- **Cloud Storage**: Trades stored in Firebase Firestore (user-specific)
- **Persistent Sessions**: Stay logged in across page refreshes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Professional dark theme with smooth animations

## Setup Instructions

### 1. Firebase Setup

Before running the application, you need to set up Firebase:

1. Follow the instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. Get your Firebase configuration from the Firebase Console
3. Update `src/firebase/config.js` with your Firebase credentials

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Authentication Methods

The application supports three authentication methods:

1. **Google OAuth**: One-click sign-in with your Google account
2. **Email/Password**: Traditional email and password (minimum 8 characters)
3. **Username Only**: Simple username-based login (no password required)

## Usage

1. **Sign Up/Log In**: Choose your preferred authentication method
2. **Add Trades**: 
   - Enter the **Coin Name** (e.g., SOL, BTC, ETH)
   - Enter the **Entry Size** (USD amount) when you entered the trade
   - Enter the **Exit Size** (USD amount) when you exited the trade
   - Select a **Category** (Fibonacci, Degen, or Conviction)
   - Click **Add Trade** to save
3. **Edit Trades**: Click the "Edit" button on any trade row
4. **Delete Trades**: Click "Delete" and confirm deletion
5. **Log Out**: Click the "Log Out" button in the header

Trades are automatically saved to Firebase Firestore and associated with your account. They persist across devices and sessions.

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- React Context API

