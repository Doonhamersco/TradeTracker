import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ForgotPasswordForm from './ForgotPasswordForm'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const { signup, login, signInWithGoogle } = useAuth()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isLogin) {
      if (!username.trim()) {
        setError('Please enter a username')
        return
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long')
        return
      }
      if (username.trim().length > 20) {
        setError('Username must be 20 characters or less')
        return
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setError('Username can only contain letters, numbers, and underscores')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter')
        return
      }
      if (!/[a-z]/.test(password)) {
        setError('Password must contain at least one lowercase letter')
        return
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }
    }

    setLoading(true)
    
    if (isLogin) {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.error || 'Provided credentials are invalid.')
      }
    } else {
      const result = await signup(email, password, username.trim())
      if (!result.success) {
        setError(result.error || 'Failed to sign up')
      } else {
        setSuccess('Account created successfully! You are now logged in.')
      }
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    const result = await signInWithGoogle()
    if (!result.success) {
      setError(result.error || 'Failed to sign in with Google')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setUsername('')
    setError('')
    setSuccess('')
    setShowForgotPassword(false)
  }

  const switchMode = (mode) => {
    setIsLogin(mode)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="brutal-section">
          {/* Header */}
          <div className="border-b-6 border-black p-8 text-center">
            <h1 className="brutal-title text-3xl md:text-4xl mb-2">TRADE TRACKER</h1>
            <p className="text-sm uppercase tracking-wider">BY DOONHAMER</p>
          </div>

          {/* Toggle */}
          <div className="flex border-b-2 border-black">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                isLogin ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              LOG IN
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider border-l-2 border-black transition-colors ${
                !isLogin ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              SIGN UP
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="m-6 p-4 border-2 border-red-700 bg-red-50 text-red-700 text-sm font-bold uppercase">
              {error}
            </div>
          )}
          {success && (
            <div className="m-6 p-4 border-2 border-green-700 bg-green-50 text-green-700 text-sm font-bold uppercase">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
            {/* Username - Only show on signup */}
            {!isLogin && (
              <div>
                <label className="brutal-label">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  className="brutal-input"
                  placeholder="CHOOSE A USERNAME"
                />
                <p className="text-xs text-gray-500 mt-1 uppercase">3-20 CHARACTERS, LETTERS, NUMBERS, UNDERSCORES</p>
              </div>
            )}
            
            <div>
              <label className="brutal-label">
                {isLogin ? 'EMAIL OR USERNAME' : 'EMAIL ADDRESS'}
              </label>
              <input
                type={isLogin ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="brutal-input"
                placeholder={isLogin ? 'EMAIL OR USERNAME' : 'YOUR@EMAIL.COM'}
              />
            </div>
            
            <div>
              <label className="brutal-label">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? 1 : 8}
                className="brutal-input"
                placeholder={isLogin ? 'ENTER PASSWORD' : 'CREATE STRONG PASSWORD'}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1 uppercase">MIN 8 CHARS WITH UPPERCASE, LOWERCASE, NUMBER</p>
              )}
            </div>
            
            {!isLogin && (
              <div>
                <label className="brutal-label">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="brutal-input"
                  placeholder="CONFIRM PASSWORD"
                />
              </div>
            )}
            
            {/* Forgot Password */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-bold uppercase hover:underline"
                >
                  FORGOT PASSWORD?
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn w-full"
            >
              {loading ? 'PROCESSING...' : isLogin ? 'LOG IN' : 'SIGN UP'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative px-6">
            <div className="absolute inset-0 flex items-center px-6">
              <div className="w-full border-t-2 border-black"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm font-bold uppercase">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="p-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="brutal-btn brutal-btn-secondary w-full flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLogin ? 'CONTINUE WITH GOOGLE' : 'SIGN UP WITH GOOGLE'}
            </button>
          </div>

          {/* Forgot Password Form */}
          <ForgotPasswordForm
            isExpanded={showForgotPassword}
            onSuccess={() => {}}
            onCancel={() => setShowForgotPassword(false)}
          />
        </div>
      </div>
    </div>
  )
}

export default Auth
