import { useState, useEffect, useRef } from 'react'
import { requestPasswordReset, checkRateLimit, recordResetAttempt } from '../services/passwordResetService'

const ForgotPasswordForm = ({ isExpanded, onSuccess, onCancel }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null)
  const emailInputRef = useRef(null)

  // Focus email input when form expands
  useEffect(() => {
    if (isExpanded && emailInputRef.current) {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 100)
    }
  }, [isExpanded])

  // Reset form when collapsed (but preserve success message briefly)
  useEffect(() => {
    if (!isExpanded) {
      // Don't clear success immediately - let user see it
      // Only clear other fields
      setEmail('')
      setError('')
      setRateLimitRemaining(null)
      // Clear success after a delay to allow it to be seen
      const timeout = setTimeout(() => {
        setSuccess('')
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [isExpanded])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setRateLimitRemaining(null)

    // Validate email format
    if (!email.trim()) {
      setError('Please enter your email address')
      emailInputRef.current?.focus()
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      emailInputRef.current?.focus()
      return
    }

    setLoading(true)

    try {
      // Check rate limit before proceeding
      const rateLimitCheck = await checkRateLimit(email)
      
      if (!rateLimitCheck.allowed) {
        const type = rateLimitCheck.type === 'email' 
          ? 'this email' 
          : 'this location'
        setError(
          `Too many reset requests for ${type}. Please try again in ${rateLimitCheck.remainingMinutes} minute${rateLimitCheck.remainingMinutes !== 1 ? 's' : ''}.`
        )
        setRateLimitRemaining(rateLimitCheck.remainingMinutes)
        setLoading(false)
        return
      }

      // Request password reset
      const result = await requestPasswordReset(email)

      if (result.success) {
        // Set success message first
        setSuccess(result.message || 'Reset Email sent successfully')
        setEmail('')
        
        // Record the attempt for rate limiting (don't await - let it run in background)
        recordResetAttempt(email).catch(err => {
          console.error('Error recording reset attempt:', err)
          // Don't show error to user, just log it
        })
        
        // Call onSuccess callback with email (if provided)
        if (onSuccess) {
          onSuccess(email)
        }

        // Auto-collapse after 8 seconds (give user time to read success message)
        setTimeout(() => {
          if (onCancel) {
            onCancel()
          }
        }, 8000)
      } else {
        setError(result.message)
        if (result.rateLimitRemaining) {
          setRateLimitRemaining(result.rateLimitRemaining)
        }
      }
    } catch (error) {
      console.error('Error in password reset:', error)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEmail('')
    setError('')
    setSuccess('')
    setRateLimitRemaining(null)
    if (onCancel) {
      onCancel()
    }
  }

  if (!isExpanded) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Reset Password</h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close forgot password form"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        If you signed up with Google, please use the Google sign-in option instead.
      </p>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
          {rateLimitRemaining && (
            <div className="mt-2 text-xs">
              You can try again in {rateLimitRemaining} minute{rateLimitRemaining !== 1 ? 's' : ''}.
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className="mb-4 p-4 bg-green-900/40 border-2 border-green-600 rounded-lg text-green-200 text-sm font-medium"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <p className="font-semibold text-green-300">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email Address
          </label>
          <input
            ref={emailInputRef}
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !!success}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'reset-email-error' : undefined}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="your@email.com"
          />
          {error && (
            <div id="reset-email-error" className="sr-only">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !!success}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            aria-busy={loading}
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
                Sending...
              </>
            ) : success ? (
              'Email Sent'
            ) : (
              'Send Reset Email'
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Back to Login Link */}
      {!success && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  )
}

export default ForgotPasswordForm

