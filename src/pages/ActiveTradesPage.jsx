import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToActiveTrades } from '../services/activeTradesService'
import { fetchMultiplePrices } from '../services/priceService'
import ActiveTradeCard from '../components/ActiveTradeCard'
import AddActiveTradeForm from '../components/AddActiveTradeForm'
import ActiveTradeDetailModal from '../components/ActiveTradeDetailModal'
import ClosePositionModal from '../components/ClosePositionModal'
import ProfileDropdown from '../components/ProfileDropdown'

function ActiveTradesPage() {
  const { currentUser, userProfile, signout } = useAuth()
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [tradeToClose, setTradeToClose] = useState(null)
  const [livePrices, setLivePrices] = useState({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!currentUser?.uid) {
      setTrades([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToActiveTrades(currentUser.uid, (result) => {
      if (result.success) {
        setTrades(result.trades)
      } else {
        console.error('Error loading active trades:', result.error)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const fetchLivePrices = useCallback(async () => {
    if (trades.length === 0) return
    
    setPricesLoading(true)
    const tickers = trades.map(t => t.assetName)
    const result = await fetchMultiplePrices(tickers)
    
    if (result.success) {
      setLivePrices(result.prices)
      setLastPriceUpdate(new Date())
    }
    setPricesLoading(false)
  }, [trades])

  useEffect(() => {
    if (trades.length > 0) {
      fetchLivePrices()
    }
  }, [trades.length])

  useEffect(() => {
    if (!autoRefresh || trades.length === 0) return
    
    const interval = setInterval(() => {
      fetchLivePrices()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLivePrices, trades.length])

  const handleViewDetails = (trade) => {
    setSelectedTrade(trade)
    setShowDetailModal(true)
  }

  const handleClosePosition = (trade) => {
    setTradeToClose(trade)
    setShowCloseModal(true)
  }

  const handleLogout = async () => {
    await signout()
  }

  // Calculate total stats
  const totalInvested = trades.reduce((sum, t) => sum + (t.positionSize || 0), 0)
  const totalPnL = trades.reduce((sum, t) => {
    const currentPrice = livePrices[t.assetName.toUpperCase()] || t.currentPrice
    const pnl = ((currentPrice - t.entryPrice) / t.entryPrice) * t.positionSize
    return sum + pnl
  }, 0)
  const winningTrades = trades.filter(t => {
    const currentPrice = livePrices[t.assetName.toUpperCase()] || t.currentPrice
    return currentPrice > t.entryPrice
  }).length
  const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(0) : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-6 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/trades')}
                className="text-sm font-bold uppercase tracking-wider hover:underline mb-4 inline-block"
              >
                ← BACK TO TRADES
              </button>
              <h1 className="brutal-title text-4xl md:text-6xl lg:text-7xl tracking-tight">
                ACTIVE TRADES
              </h1>
            </div>
            <ProfileDropdown
              currentUser={currentUser}
              userProfile={userProfile}
              onLogout={handleLogout}
              trades={trades}
              onShowPNL={() => navigate('/pnl')}
              onShowProfile={() => {}}
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 mt-8 flex-wrap">
            <button 
              onClick={() => setShowAddForm(true)}
              className="brutal-btn"
            >
              + ADD TRADE
            </button>
            <button 
              onClick={fetchLivePrices}
              disabled={pricesLoading}
              className="brutal-btn brutal-btn-secondary"
            >
              {pricesLoading ? 'UPDATING...' : '↻ REFRESH PRICES'}
            </button>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`brutal-btn ${autoRefresh ? '' : 'brutal-btn-secondary'}`}
            >
              {autoRefresh ? '● LIVE' : '○ PAUSED'}
            </button>
            {lastPriceUpdate && (
              <span className="text-sm font-mono self-center">
                LAST UPDATE: {lastPriceUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Stats Summary */}
        {trades.length > 0 && (
          <section className="brutal-section mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div className="p-6 border-r-2 border-b-2 md:border-b-0 border-black">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">ACTIVE POSITIONS</p>
                <p className="text-3xl font-bold font-mono">{trades.length}</p>
              </div>
              <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">TOTAL INVESTED</p>
                <p className="text-3xl font-bold font-mono">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="p-6 border-r-2 border-black">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">UNREALIZED P&L</p>
                <p className={`text-3xl font-bold font-mono ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">WIN RATE</p>
                <p className="text-3xl font-bold font-mono">{winRate}%</p>
              </div>
            </div>
          </section>
        )}

        {/* Trades Grid */}
        {loading ? (
          <div className="brutal-section p-16 text-center">
            <p className="brutal-title text-xl">LOADING...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="brutal-section p-16 text-center">
            <p className="brutal-title text-3xl mb-4">NO ACTIVE TRADES</p>
            <p className="text-gray-600 uppercase text-sm tracking-wider mb-8">
              Start tracking your open positions
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="brutal-btn"
            >
              + ADD YOUR FIRST TRADE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {trades.map((trade) => (
              <ActiveTradeCard
                key={trade.id}
                trade={trade}
                livePrice={livePrices[trade.assetName.toUpperCase()]}
                onViewDetails={() => handleViewDetails(trade)}
                onClosePosition={() => handleClosePosition(trade)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-6 border-black mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex justify-between items-center">
          <p className="text-sm font-bold uppercase tracking-wider">
            TRADE TRACKER BY DOONHAMER
          </p>
          <p className="text-sm font-mono">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showAddForm && (
        <AddActiveTradeForm
          onClose={() => setShowAddForm(false)}
          userId={currentUser?.uid}
        />
      )}

      {showDetailModal && selectedTrade && (
        <ActiveTradeDetailModal
          trade={selectedTrade}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedTrade(null)
          }}
          onClosePosition={() => {
            setShowDetailModal(false)
            handleClosePosition(selectedTrade)
          }}
        />
      )}

      {showCloseModal && tradeToClose && (
        <ClosePositionModal
          trade={tradeToClose}
          onClose={() => {
            setShowCloseModal(false)
            setTradeToClose(null)
          }}
          userId={currentUser?.uid}
        />
      )}
    </div>
  )
}

export default ActiveTradesPage
