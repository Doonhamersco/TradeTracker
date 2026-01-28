import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import Auth from './components/Auth'
import HomePage from './pages/HomePage'
import PNLPage from './pages/PNLPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ActiveTradesPage from './pages/ActiveTradesPage'
import BackgroundVideo from './components/BackgroundVideo'
import { subscribeToUserTrades } from './services/tradesService'

function App() {
  const { currentUser } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  // Set up real-time listener for trades when user is logged in
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      console.log('User logged out')
      setTrades([])
      setLoading(false)
      return
    }

    console.log(`User logged in: ${currentUser.uid}`)
    setLoading(true)
    const userId = currentUser.uid

    // Set up real-time listener
    const unsubscribe = subscribeToUserTrades(userId, (result) => {
      console.log('Trades callback received:', result)
      if (result.success) {
        console.log(`Setting ${result.trades.length} trades in state`)
        setTrades(result.trades)
        console.log(`Trades updated. Total: ${result.trades.length}`)
      } else {
        console.error('Error loading trades:', result.error)
        alert('Error loading trades: ' + result.error)
      }
      setLoading(false)
    })

    // Cleanup listener on unmount or user change
    return () => {
      console.log('Unsubscribing from trades listener')
      unsubscribe()
    }
  }, [currentUser])

  return (
    <>
      {/* Background Video - appears on all pages */}
      <BackgroundVideo />
      
      {/* Main Content - positioned above video */}
      <div className="relative z-10">
        <Routes>
          <Route 
            path="/" 
            element={currentUser ? <Navigate to="/trades" replace /> : <LandingPage />} 
          />
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/trades" replace /> : <Auth />} 
          />
          <Route 
            path="/reset-password" 
            element={<ResetPasswordPage />} 
          />
          <Route 
            path="/trades" 
            element={currentUser ? <HomePage trades={trades} loading={loading} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/pnl" 
            element={currentUser ? <PNLPage trades={trades} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/active" 
            element={currentUser ? <ActiveTradesPage /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
