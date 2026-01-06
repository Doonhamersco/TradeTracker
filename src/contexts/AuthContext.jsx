import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [usernameSession, setUsernameSession] = useState(null) // For username-only auth

  // Sign up with email and password
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString()
      })
      
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user
      
      // Check if user profile exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date().toISOString()
        })
      }
      
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign in with username (custom implementation)
  const signInWithUsername = async (username) => {
    try {
      const usernameLower = username.toLowerCase().trim()
      
      // Check if username exists in Firestore
      const usernameRef = collection(db, 'usernames')
      const q = query(usernameRef, where('username', '==', usernameLower))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Username not found' }
      }
      
      const usernameDoc = querySnapshot.docs[0]
      const userId = usernameDoc.data().userId
      
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        return { success: false, error: 'User account not found' }
      }
      
      const userData = userDoc.data()
      
      // For username-only auth, we create a custom user object and store session
      const customUser = { 
        uid: userId, 
        displayName: username,
        email: userData.email || null,
        isUsernameAuth: true 
      }
      
      setCurrentUser(customUser)
      setUserProfile(userData)
      setUsernameSession({ userId, username: usernameLower })
      
      // Store session in localStorage (only for username auth)
      localStorage.setItem('usernameSession', JSON.stringify({ userId, username: usernameLower }))
      
      return { success: true, user: customUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign up with username
  const signupWithUsername = async (username) => {
    try {
      const usernameLower = username.toLowerCase().trim()
      
      // Check if username already exists
      const usernameRef = collection(db, 'usernames')
      const q = query(usernameRef, where('username', '==', usernameLower))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        return { success: false, error: 'Username already taken' }
      }
      
      // Create a temporary user ID for username-only accounts
      const tempUserId = `username_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create user document
      await setDoc(doc(db, 'users', tempUserId), {
        username: usernameLower,
        createdAt: new Date().toISOString()
      })
      
      // Create username lookup document
      await setDoc(doc(db, 'usernames', usernameLower), {
        username: usernameLower,
        userId: tempUserId,
        createdAt: new Date().toISOString()
      })
      
      const customUser = { 
        uid: tempUserId, 
        displayName: username,
        isUsernameAuth: true 
      }
      
      setCurrentUser(customUser)
      setUserProfile({ username: usernameLower })
      setUsernameSession({ userId: tempUserId, username: usernameLower })
      
      // Store session in localStorage (only for username auth)
      localStorage.setItem('usernameSession', JSON.stringify({ userId: tempUserId, username: usernameLower }))
      
      return { success: true, user: customUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Sign out
  const signout = async () => {
    try {
      // If it's a username-only session, just clear local state
      if (currentUser && currentUser.isUsernameAuth) {
        setCurrentUser(null)
        setUserProfile(null)
        setUsernameSession(null)
        localStorage.removeItem('usernameSession')
        return { success: true }
      }
      
      // Otherwise, sign out from Firebase
      await firebaseSignOut(auth)
      setCurrentUser(null)
      setUserProfile(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Load user profile
  const loadUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        setUserProfile(userDoc.data())
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Update user profile
  const updateUserProfile = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, updates)
      
      // Reload profile to get updated data
      await loadUserProfile(userId)
      
      return { success: true }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe
    
    const initAuth = async () => {
      // Check for username session first
      const storedSession = localStorage.getItem('usernameSession')
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession)
          const userDoc = await getDoc(doc(db, 'users', session.userId))
          if (userDoc.exists()) {
            const customUser = {
              uid: session.userId,
              displayName: session.username,
              isUsernameAuth: true
            }
            setCurrentUser(customUser)
            setUserProfile(userDoc.data())
            setUsernameSession(session)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error loading username session:', error)
          localStorage.removeItem('usernameSession')
        }
      }
      
      // Listen for Firebase auth changes
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log(`User logged in: ${user.uid}`)
          setCurrentUser(user)
          await loadUserProfile(user.uid)
        } else {
          console.log('User logged out')
          setCurrentUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      })
    }
    
    initAuth()
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    signInWithGoogle,
    signInWithUsername,
    signupWithUsername,
    signout,
    loadUserProfile,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

