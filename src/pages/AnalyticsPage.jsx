import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserTrades } from '../services/tradesService'
import AppLayout from '../components/Layout/AppLayout'
import SubNav from '../components/Navigation/SubNav'
import PNLCalendar from '../components/PNLCalendar'
import PNLSummary from '../components/PNLSummary'
import WinRateStats from '../components/WinRateStats'

function AnalyticsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  // Determine active sub-tab from URL
  const getActiveTab = () => {
    const path = location.pathname
    if (path.includes('/analytics/summary')) return 'summary'
    if (path.includes('/analytics/winrate')) return 'winrate'
    return 'calendar' // default
  }

  const activeTab = getActiveTab()

  // Subscribe to trades
  useEffect(() => {
    if (!currentUser?.uid) {
      setTrades([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserTrades(currentUser.uid, (result) => {
      if (result.success) {
        setTrades(result.trades)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const subNavTabs = [
    { id: 'calendar', label: 'PNL CALENDAR', path: '' },
    { id: 'summary', label: 'PNL SUMMARY', path: '/summary' },
    { id: 'winrate', label: 'WIN RATE', path: '/winrate' },
  ]

  return (
    <AppLayout>
      {/* Sub Navigation */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SubNav tabs={subNavTabs} basePath="/analytics" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {loading ? (
          <div className="brutal-section p-16 text-center">
            <p className="brutal-title text-xl">LOADING...</p>
          </div>
        ) : (
          <section className="brutal-section">
            <div className="p-8">
              {activeTab === 'calendar' && <PNLCalendar trades={trades} />}
              {activeTab === 'summary' && <PNLSummary trades={trades} />}
              {activeTab === 'winrate' && <WinRateStats trades={trades} />}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  )
}

export default AnalyticsPage

