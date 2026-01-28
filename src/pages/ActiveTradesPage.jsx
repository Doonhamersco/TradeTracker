import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react'
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

  // Subscribe to active trades
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

  // Fetch live prices from CoinGecko
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

  // Fetch prices when trades change
  useEffect(() => {
    if (trades.length > 0) {
      fetchLivePrices()
    }
  }, [trades.length]) // Only refetch when number of trades changes

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    if (!autoRefresh || trades.length === 0) return
    
    const interval = setInterval(() => {
      fetchLivePrices()
    }, 30000) // 30 seconds
    
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

  return (
    <div className="min-h-screen text-white relative z-10">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/trades')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Back to Trade History"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Active Trades</h1>
                <p className="text-gray-400">Track your open positions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Refresh Prices */}
              <button
                onClick={fetchLivePrices}
                disabled={pricesLoading}
                className={`flex items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  pricesLoading ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                title={lastPriceUpdate ? `Last updated: ${lastPriceUpdate.toLocaleTimeString()}` : 'Refresh prices'}
              >
                <RefreshCw className={`w-4 h-4 ${pricesLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">
                  {pricesLoading ? 'Updating...' : 'Refresh'}
                </span>
              </button>
              
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                  autoRefresh ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-gray-800 text-gray-400'
                }`}
                title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
              >
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Trade</span>
              </button>
              <ProfileDropdown
                currentUser={currentUser}
                userProfile={userProfile}
                onLogout={handleLogout}
                trades={trades}
                onShowPNL={() => navigate('/pnl')}
                onShowProfile={() => {}}
              />
            </div>
          </div>
        </header>

        {/* Stats Summary */}
        {trades.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm">Active Positions</p>
              <p className="text-2xl font-bold text-white">{trades.length}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm">Total Invested</p>
              <p className="text-2xl font-bold text-white">
                ${trades.reduce((sum, t) => sum + (t.positionSize || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm">Unrealized P&L</p>
              {(() => {
                const totalPnL = trades.reduce((sum, t) => {
                  // Use live price if available, otherwise use stored currentPrice
                  const currentPrice = livePrices[t.assetName.toUpperCase()] || t.currentPrice
                  const pnl = ((currentPrice - t.entryPrice) / t.entryPrice) * t.positionSize
                  return sum + pnl
                }, 0)
                return (
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                )
              })()}
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm">Win Rate</p>
              {(() => {
                const winning = trades.filter(t => {
                  const currentPrice = livePrices[t.assetName.toUpperCase()] || t.currentPrice
                  return currentPrice > t.entryPrice
                }).length
                const winRate = trades.length > 0 ? (winning / trades.length * 100).toFixed(0) : 0
                return (
                  <p className="text-2xl font-bold text-white">{winRate}%</p>
                )
              })()}
            </div>
          </div>
        )}

        {/* Active Trades Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading active trades...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Active Trades</h3>
              <p className="text-gray-400 mb-6">
                Start tracking your open positions. Add your first active trade to monitor your thesis and P&L in real-time.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Trade
              </button>
            </div>
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
      </div>

      {/* Add Trade Form Modal */}
      {showAddForm && (
        <AddActiveTradeForm
          onClose={() => setShowAddForm(false)}
          userId={currentUser?.uid}
        />
      )}

      {/* Trade Detail Modal */}
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

      {/* Close Position Modal */}
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

