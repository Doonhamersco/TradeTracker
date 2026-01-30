import { useState, useEffect, useRef } from 'react'
import { requestPasswordReset, checkRateLimit, recordResetAttempt } from '../services/passwordResetService'

const ForgotPasswordForm = ({ isExpanded, onSuccess, onCancel }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null)
  const emailInputRef = useRef(null)

  useEffect(() => {
    if (isExpanded && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 100)
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isExpanded) {
      setEmail('')
      setError('')
      setRateLimitRemaining(null)
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

      const result = await requestPasswordReset(email)

      if (result.success) {
        setSuccess(result.message || 'RESET EMAIL SENT SUCCESSFULLY')
        setEmail('')
        
        recordResetAttempt(email).catch(err => {
          console.error('Error recording reset attempt:', err)
        })
        
        if (onSuccess) {
          onSuccess(email)
        }

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
    <div className="mt-4 p-4 border-2 border-black">
      <div className="flex items-center justify-between mb-4">
        <h3 className="brutal-label">RESET PASSWORD</h3>
        <button
          onClick={handleCancel}
          className="w-8 h-8 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-gray-600 uppercase mb-4">
        ENTER YOUR EMAIL AND WE'LL SEND YOU A RESET LINK.
      </p>

      {error && (
        <div className="mb-4 p-3 border-2 border-red-700 bg-red-50 text-red-700 text-sm font-bold uppercase">
          {error}
          {rateLimitRemaining && (
            <div className="mt-2 text-xs">
              TRY AGAIN IN {rateLimitRemaining} MINUTE{rateLimitRemaining !== 1 ? 'S' : ''}.
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 border-2 border-green-700 bg-green-50 text-green-700 text-sm font-bold uppercase">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="brutal-label">EMAIL ADDRESS</label>
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !!success}
            className="brutal-input"
            placeholder="YOUR@EMAIL.COM"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !!success}
            className="brutal-btn flex-1"
          >
            {loading ? 'SENDING...' : success ? 'SENT ✓' : 'SEND RESET EMAIL'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="brutal-btn brutal-btn-secondary"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  )
}

export default ForgotPasswordForm
