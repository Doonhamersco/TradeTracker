// Password Reset Service
// Handles password reset requests with rate limiting and error handling

import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'

/**
 * Request a password reset email
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message: string, errorCode?: string, rateLimitRemaining?: number}>}
 */
export const requestPasswordReset = async (email) => {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Please enter a valid email address',
        errorCode: 'invalid-email'
      }
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limits (will be implemented in Phase 2)
    // For now, proceed with reset request

      // Send password reset email via Firebase
    try {
      // Use handleCodeInApp: false so Firebase redirects to our custom page
      // The continueUrl will be used after Firebase processes the action
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: window.location.origin + '/reset-password',
        handleCodeInApp: false
      })

      // Note: Firebase will succeed even for Google-only users, but won't send email
      // We show success message to prevent enumeration attacks
      // Log successful request (will be implemented in Phase 4)
      
      return {
        success: true,
        message: 'Reset Email sent successfully'
      }
    } catch (firebaseError) {
      // Handle Firebase errors
      const errorCode = firebaseError.code
      
      // Prevent enumeration: always show success for user-not-found
      if (errorCode === 'auth/user-not-found') {
        // Log the actual error for monitoring, but show success to user
        console.warn('Password reset requested for non-existent email:', normalizedEmail)
        
        return {
          success: true,
          message: `Password reset email sent to ${normalizedEmail}`,
          errorCode: 'user-not-found' // For logging purposes
        }
      }

      // Handle other Firebase errors
      if (errorCode === 'auth/invalid-email') {
        return {
          success: false,
          message: 'Please enter a valid email address',
          errorCode: 'invalid-email'
        }
      }

      if (errorCode === 'auth/too-many-requests') {
        return {
          success: false,
          message: 'Too many requests. Please try again later.',
          errorCode: 'too-many-requests'
        }
      }

      // Network errors
      if (errorCode === 'auth/network-request-failed') {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.',
          errorCode: 'network-error'
        }
      }

      // Generic error
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
        errorCode: errorCode || 'unknown-error'
      }
    }
  } catch (error) {
    console.error('Unexpected error in requestPasswordReset:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      errorCode: 'unexpected-error'
    }
  }
}

/**
 * Check if a reset request is allowed based on rate limits
 * @param {string} email - User's email address
 * @param {string} ipAddress - User's IP address (optional)
 * @returns {Promise<{allowed: boolean, type?: 'email' | 'ip', remainingMinutes?: number}>}
 */
export const checkRateLimit = async (email, ipAddress = null) => {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    const now = new Date()
    const hourTimestamp = Math.floor(now.getTime() / (1000 * 60 * 60)) * (1000 * 60 * 60) // Round to hour
    
    // Check email rate limit (3 per hour)
    const emailDocId = `${normalizedEmail}_${hourTimestamp}`
    const emailDocRef = doc(db, 'passwordResetAttempts', emailDocId)
    const emailDoc = await getDoc(emailDocRef)
    
    if (emailDoc.exists()) {
      const data = emailDoc.data()
      if (data.count >= 3) {
        // Calculate remaining minutes
        const nextHour = hourTimestamp + (60 * 60 * 1000)
        const remainingMs = nextHour - now.getTime()
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
        
        return {
          allowed: false,
          type: 'email',
          remainingMinutes: Math.max(1, remainingMinutes)
        }
      }
    }

    // Check IP rate limit (5 per hour) if IP is provided
    if (ipAddress) {
      const ipDocId = `${ipAddress}_${hourTimestamp}`
      const ipDocRef = doc(db, 'passwordResetIPAttempts', ipDocId)
      const ipDoc = await getDoc(ipDocRef)
      
      if (ipDoc.exists()) {
        const data = ipDoc.data()
        if (data.count >= 5) {
          // Calculate remaining minutes
          const nextHour = hourTimestamp + (60 * 60 * 1000)
          const remainingMs = nextHour - now.getTime()
          const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
          
          return {
            allowed: false,
            type: 'ip',
            remainingMinutes: Math.max(1, remainingMinutes)
          }
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // On error, allow the request (fail open for better UX)
    return { allowed: true }
  }
}

/**
 * Record a password reset attempt for rate limiting
 * @param {string} email - User's email address
 * @param {string} ipAddress - User's IP address (optional)
 * @returns {Promise<void>}
 */
export const recordResetAttempt = async (email, ipAddress = null) => {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    const now = new Date()
    const hourTimestamp = Math.floor(now.getTime() / (1000 * 60 * 60)) * (1000 * 60 * 60)
    
    // Record email attempt
    const emailDocId = `${normalizedEmail}_${hourTimestamp}`
    const emailDocRef = doc(db, 'passwordResetAttempts', emailDocId)
    const emailDoc = await getDoc(emailDocRef)
    
    if (emailDoc.exists()) {
      await updateDoc(emailDocRef, {
        count: increment(1),
        lastRequest: serverTimestamp()
      })
    } else {
      await setDoc(emailDocRef, {
        email: normalizedEmail,
        timestamp: serverTimestamp(),
        count: 1,
        ipAddress: ipAddress || null,
        lastRequest: serverTimestamp()
      })
    }

    // Record IP attempt if IP is provided
    if (ipAddress) {
      const ipDocId = `${ipAddress}_${hourTimestamp}`
      const ipDocRef = doc(db, 'passwordResetIPAttempts', ipDocId)
      const ipDoc = await getDoc(ipDocRef)
      
      if (ipDoc.exists()) {
        await updateDoc(ipDocRef, {
          count: increment(1),
          lastRequest: serverTimestamp()
        })
      } else {
        await setDoc(ipDocRef, {
          ipAddress: ipAddress,
          timestamp: serverTimestamp(),
          count: 1,
          lastRequest: serverTimestamp()
        })
      }
    }
  } catch (error) {
    console.error('Error recording reset attempt:', error)
    // Don't throw - rate limiting is best effort
  }
}

/**
 * Get user's IP address (client-side approximation)
 * @returns {Promise<string|null>}
 */
export const getUserIPAddress = async () => {
  try {
    // Try to get IP from a public API (optional, can be removed if privacy concerns)
    // For now, return null and rely on server-side IP detection if needed
    // This is a placeholder for future server-side implementation
    return null
  } catch (error) {
    return null
  }
}

