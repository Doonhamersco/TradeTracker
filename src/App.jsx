import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Auth from './components/Auth'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PortfolioPage from './pages/PortfolioPage'
import WealthTrackerPage from './pages/WealthTrackerPage'
import TradesPage from './pages/TradesPage'
import AnalyticsPage from './pages/AnalyticsPage'

function App() {
  const { currentUser } = useAuth()

  return (
    <div className="relative z-10">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={currentUser ? <Navigate to="/portfolio" replace /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/portfolio" replace /> : <Auth />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        {/* Protected Routes - Portfolio */}
        <Route 
          path="/portfolio" 
          element={currentUser ? <PortfolioPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/portfolio/wealth" 
          element={currentUser ? <WealthTrackerPage /> : <Navigate to="/login" replace />} 
        />

        {/* Protected Routes - Trades */}
        <Route 
          path="/trades" 
          element={currentUser ? <TradesPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/trades/active" 
          element={currentUser ? <TradesPage /> : <Navigate to="/login" replace />} 
        />

        {/* Protected Routes - Analytics */}
        <Route 
          path="/analytics" 
          element={currentUser ? <AnalyticsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/analytics/summary" 
          element={currentUser ? <AnalyticsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/analytics/winrate" 
          element={currentUser ? <AnalyticsPage /> : <Navigate to="/login" replace />} 
        />

        {/* Legacy redirects */}
        <Route path="/pnl" element={<Navigate to="/analytics" replace />} />
        <Route path="/active" element={<Navigate to="/trades/active" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
