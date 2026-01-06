import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [authMethod, setAuthMethod] = useState('email') // 'email', 'google', 'username'
  
  // Email/Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Username state
  const [username, setUsername] = useState('')
  
  // UI state
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const { signup, login, signInWithGoogle, signInWithUsername, signupWithUsername } = useAuth()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isLogin) {
      // Registration
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
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
        setError(result.error || 'Failed to log in')
      }
    } else {
      const result = await signup(email, password)
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

  const handleUsernameSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }

    setLoading(true)
    
    if (isLogin) {
      const result = await signInWithUsername(username)
      if (!result.success) {
        setError(result.error || 'Failed to log in')
      }
    } else {
      const result = await signupWithUsername(username)
      if (!result.success) {
        setError(result.error || 'Failed to sign up')
      } else {
        setSuccess('Account created successfully! You are now logged in.')
      }
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
  }

  const switchMode = (mode) => {
    setIsLogin(mode)
    resetForm()
  }

  const switchMethod = (method) => {
    setAuthMethod(method)
    resetForm()
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Trade Tracker by Doonhamer</h1>
            <p className="text-gray-400">Sign in to access your trades</p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Method Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => switchMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                authMethod === 'email'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => switchMethod('google')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                authMethod === 'google'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => switchMethod('username')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                authMethod === 'username'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Username
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* Google Auth */}
          {authMethod === 'google' && (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
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
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          )}

          {/* Email/Password Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder={isLogin ? "Enter your password" : "Minimum 8 characters"}
                />
              </div>
              {!isLogin && (
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Username Form */}
          {authMethod === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  required
                  minLength={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Choose a username (min 3 characters)"
                />
                {!isLogin && (
                  <p className="mt-1 text-xs text-gray-500">
                    Letters, numbers, and underscores only
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth

