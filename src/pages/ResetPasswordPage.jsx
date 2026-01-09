import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../firebase/config'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState('')

  // Get action code from URL
  const actionCode = searchParams.get('oobCode')
  const mode = searchParams.get('mode')

  useEffect(() => {
    // Verify the action code and get email
    const verifyCode = async () => {
      // Check if we have the action code from URL params
      // Firebase may pass it as 'oobCode' or we might need to extract it from the URL
      if (!actionCode) {
        // Try to get from window location if not in search params (Firebase redirect)
        const urlParams = new URLSearchParams(window.location.search)
        const codeFromUrl = urlParams.get('oobCode') || urlParams.get('code')
        if (codeFromUrl) {
          // Redirect with proper params
          window.history.replaceState({}, '', `/reset-password?mode=resetPassword&oobCode=${codeFromUrl}`)
          window.location.reload()
          return
        }
      }

      if (!actionCode || mode !== 'resetPassword') {
        setError('Invalid or missing reset link.')
        setVerifying(false)
        return
      }

      try {
        // Verify the password reset code and get the email
        const email = await verifyPasswordResetCode(auth, actionCode)
        setEmail(email)
        setVerifying(false)
      } catch (error) {
        console.error('Error verifying reset code:', error)
        
        if (error.code === 'auth/expired-action-code') {
          setError('This reset link has expired. Please request a new password reset.')
        } else if (error.code === 'auth/invalid-action-code') {
          setError('This reset link is invalid or has already been used.')
        } else {
          setError('An error occurred verifying your reset link. Please try again.')
        }
        setVerifying(false)
      }
    }

    verifyCode()
  }, [actionCode, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!password.trim()) {
      setError('Please enter a new password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!actionCode) {
      setError('Invalid reset link')
      return
    }

    setLoading(true)

    try {
      // Confirm password reset
      await confirmPasswordReset(auth, actionCode, password)
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successfully! You can now log in with your new password.' }
        })
      }, 3000)
    } catch (error) {
      console.error('Error resetting password:', error)
      
      if (error.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new password reset.')
      } else if (error.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or has already been used.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.')
      } else {
        setError('An error occurred resetting your password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-400">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold mb-2 text-white">Password Reset Successful!</h1>
              <p className="text-gray-400 mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Trade Tracker by Doonhamer</h1>
            <p className="text-gray-400">Reset your password</p>
          </div>

          {email && (
            <p className="text-sm text-gray-400 mb-6 text-center">
              Reset password for <span className="text-white font-medium">{email}</span>
            </p>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
              {error.includes('expired') && (
                <div className="mt-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-blue-400 hover:text-blue-300 underline text-xs"
                  >
                    Request a new reset link
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

