import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserTrades, addTrade, updateTrade, deleteTrade } from '../services/tradesService'
import { subscribeToActiveTrades } from '../services/activeTradesService'
import { fetchMultiplePrices } from '../services/priceService'
import AppLayout from '../components/Layout/AppLayout'
import SubNav from '../components/Navigation/SubNav'
import ProfileModal from '../components/ProfileModal'
import SharePNL from '../components/SharePNL'
import ActiveTradeCard from '../components/ActiveTradeCard'
import AddActiveTradeForm from '../components/AddActiveTradeForm'
import ActiveTradeDetailModal from '../components/ActiveTradeDetailModal'
import ClosePositionModal from '../components/ClosePositionModal'

function TradesPage() {
  const { currentUser, userProfile } = useAuth()
  const location = useLocation()
  
  // Determine active sub-tab
  const isActiveTradesView = location.pathname.includes('/trades/active')

  // Trade History State
  const [trades, setTrades] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [tradesLoading, setTradesLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')

  // Active Trades State
  const [activeTrades, setActiveTrades] = useState([])
  const [activeTradesLoading, setActiveTradesLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [tradeToClose, setTradeToClose] = useState(null)
  const [livePrices, setLivePrices] = useState({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Form state for trade history
  const getCurrentDateString = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const [formData, setFormData] = useState({
    coinName: '',
    entrySize: '',
    exitSize: '',
    category: 'Fibonacci',
    date: getCurrentDateString()
  })

  // Subscribe to trade history
  useEffect(() => {
    if (!currentUser?.uid) {
      setTrades([])
      setTradesLoading(false)
      return
    }

    setTradesLoading(true)
    const unsubscribe = subscribeToUserTrades(currentUser.uid, (result) => {
      if (result.success) {
        setTrades(result.trades)
      }
      setTradesLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to active trades
  useEffect(() => {
    if (!currentUser?.uid) {
      setActiveTrades([])
      setActiveTradesLoading(false)
      return
    }

    setActiveTradesLoading(true)
    const unsubscribe = subscribeToActiveTrades(currentUser.uid, (result) => {
      if (result.success) {
        setActiveTrades(result.trades)
      }
      setActiveTradesLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch live prices for active trades
  const fetchLivePrices = async () => {
    if (activeTrades.length === 0) return
    
    setPricesLoading(true)
    const tickers = activeTrades.map(t => t.assetName)
    const result = await fetchMultiplePrices(tickers)
    
    if (result.success) {
      setLivePrices(result.prices)
    }
    setPricesLoading(false)
  }

  useEffect(() => {
    if (activeTrades.length > 0) {
      fetchLivePrices()
    }
  }, [activeTrades.length])

  useEffect(() => {
    if (!autoRefresh || activeTrades.length === 0) return
    
    const interval = setInterval(fetchLivePrices, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, activeTrades.length])

  // Trade History handlers
  const calculateProfitUSD = (entry, exit) => parseFloat(exit) - parseFloat(entry)
  const calculateProfitPercent = (entry, exit) => {
    if (parseFloat(entry) === 0) return 0
    return ((parseFloat(exit) - parseFloat(entry)) / parseFloat(entry)) * 100
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.coinName?.trim()) {
      alert('Please enter a coin name')
      return
    }
    
    const entry = parseFloat(formData.entrySize)
    const exit = parseFloat(formData.exitSize)

    if (isNaN(entry) || isNaN(exit) || entry <= 0 || exit < 0) {
      alert('Please enter valid positive numbers')
      return
    }

    const profitUSD = calculateProfitUSD(formData.entrySize, formData.exitSize)
    const profitPercent = calculateProfitPercent(formData.entrySize, formData.exitSize)

    let dateISO
    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
      dateISO = selectedDate.toISOString()
    } else {
      dateISO = new Date().toISOString()
    }

    const tradeData = {
      coinName: formData.coinName.trim().toUpperCase(),
      entrySize: entry,
      exitSize: exit,
      profitUSD,
      profitPercent,
      category: formData.category,
      date: dateISO
    }

    if (editingId) {
      const result = await updateTrade(editingId, tradeData, currentUser.uid)
      if (result.success) setEditingId(null)
      else alert('Error updating trade: ' + result.error)
    } else {
      const result = await addTrade(tradeData, currentUser.uid)
      if (!result.success) alert('Error adding trade: ' + result.error)
    }
    
    setFormData({
      coinName: '',
      entrySize: '',
      exitSize: '',
      category: 'Fibonacci',
      date: getCurrentDateString()
    })
  }

  const handleEdit = (trade) => {
    setFormData({
      coinName: trade.coinName || '',
      entrySize: trade.entrySize.toString(),
      exitSize: trade.exitSize.toString(),
      category: trade.category,
      date: trade.date ? trade.date.split('T')[0] : getCurrentDateString()
    })
    setEditingId(trade.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = async (id) => {
    const result = await deleteTrade(id)
    if (result.success) {
      setDeleteConfirmId(null)
      if (editingId === id) {
        setEditingId(null)
        setFormData({ coinName: '', entrySize: '', exitSize: '', category: 'Fibonacci', date: getCurrentDateString() })
      }
    } else {
      alert('Error deleting trade: ' + result.error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ coinName: '', entrySize: '', exitSize: '', category: 'Fibonacci', date: getCurrentDateString() })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedTrades = [...trades].sort((a, b) => {
    let aValue, bValue
    switch (sortColumn) {
      case 'coinName': aValue = (a.coinName || '').toLowerCase(); bValue = (b.coinName || '').toLowerCase(); break
      case 'date': aValue = a.date ? new Date(a.date).getTime() : 0; bValue = b.date ? new Date(b.date).getTime() : 0; break
      case 'profitUSD': aValue = parseFloat(a.profitUSD) || 0; bValue = parseFloat(b.profitUSD) || 0; break
      case 'profitPercent': aValue = parseFloat(a.profitPercent) || 0; bValue = parseFloat(b.profitPercent) || 0; break
      default: return 0
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Formatters
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString))
  }

  const SortIcon = ({ column }) => {
    const isActive = sortColumn === column
    return <span className={`ml-2 ${isActive ? 'opacity-100' : 'opacity-30'}`}>{isActive && sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  const subNavTabs = [
    { id: 'history', label: 'TRADE HISTORY', path: '' },
    { id: 'active', label: 'ACTIVE TRADES', path: '/active' },
  ]

  return (
    <AppLayout>
      {/* Sub Navigation */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SubNav tabs={subNavTabs} basePath="/trades" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {!isActiveTradesView ? (
          /* Trade History View */
          <>
            {/* Add Trade Form */}
            <section className="brutal-section mb-12">
              <div className="border-b-6 border-black px-8 py-4">
                <h2 className="brutal-title text-2xl md:text-3xl">
                  {editingId ? 'EDIT TRADE' : 'ADD NEW TRADE'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div>
                    <label className="brutal-label">COIN NAME</label>
                    <input type="text" name="coinName" value={formData.coinName} onChange={handleChange} required className="brutal-input" placeholder="SOL, BTC..." />
                  </div>
                  <div>
                    <label className="brutal-label">ENTRY SIZE (USD)</label>
                    <input type="number" name="entrySize" value={formData.entrySize} onChange={handleChange} step="0.01" min="0" required className="brutal-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="brutal-label">EXIT SIZE (USD)</label>
                    <input type="number" name="exitSize" value={formData.exitSize} onChange={handleChange} step="0.01" min="0" required className="brutal-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="brutal-label">CATEGORY</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="brutal-input">
                      <option value="Fibonacci">FIBONACCI</option>
                      <option value="Degen">DEGEN</option>
                      <option value="Conviction">CONVICTION</option>
                    </select>
                  </div>
                  <div>
                    <label className="brutal-label">DATE</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="brutal-input" />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="submit" className="brutal-btn">{editingId ? 'SAVE CHANGES' : 'ADD TRADE'}</button>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="brutal-btn brutal-btn-secondary">CANCEL</button>}
                </div>
              </form>
            </section>

            {/* Trade History Table */}
            <section className="brutal-section">
              <div className="border-b-6 border-black px-8 py-4 flex justify-between items-center">
                <h2 className="brutal-title text-2xl md:text-3xl">TRADE HISTORY</h2>
                <span className="text-sm font-mono">{trades.length} TRADES</span>
              </div>
              
              {tradesLoading ? (
                <div className="p-16 text-center"><p className="brutal-title text-xl">LOADING...</p></div>
              ) : trades.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="brutal-title text-2xl mb-2">NO TRADES YET</p>
                  <p className="text-gray-600 uppercase text-sm">Add your first trade using the form above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="brutal-table">
                    <thead>
                      <tr>
                        <th className="cursor-pointer select-none" onClick={() => handleSort('coinName')}>COIN <SortIcon column="coinName" /></th>
                        <th className="cursor-pointer select-none" onClick={() => handleSort('date')}>DATE <SortIcon column="date" /></th>
                        <th>ENTRY</th>
                        <th>EXIT</th>
                        <th className="cursor-pointer select-none" onClick={() => handleSort('profitUSD')}>PROFIT (USD) <SortIcon column="profitUSD" /></th>
                        <th className="cursor-pointer select-none" onClick={() => handleSort('profitPercent')}>PROFIT (%) <SortIcon column="profitPercent" /></th>
                        <th>CATEGORY</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTrades.map((trade) => (
                        deleteConfirmId === trade.id ? (
                          <tr key={trade.id} className="bg-yellow-50">
                            <td colSpan="8" className="!p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-bold uppercase text-sm">CONFIRM DELETE?</span>
                                <div className="flex gap-2">
                                  <button onClick={() => setDeleteConfirmId(null)} className="brutal-btn brutal-btn-secondary text-xs py-2 px-4">CANCEL</button>
                                  <button onClick={() => handleDeleteConfirm(trade.id)} className="brutal-btn text-xs py-2 px-4 !bg-red-700 !border-red-700 hover:!bg-white hover:!text-red-700">DELETE</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={trade.id} className={editingId === trade.id ? 'bg-yellow-50' : ''}>
                            <td className="font-bold">{trade.coinName || 'N/A'}</td>
                            <td className="font-mono text-sm">{formatDate(trade.date)}</td>
                            <td className="font-mono">{formatCurrency(trade.entrySize)}</td>
                            <td className="font-mono">{formatCurrency(trade.exitSize)}</td>
                            <td className={`font-bold font-mono ${trade.profitUSD >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(trade.profitUSD)}</td>
                            <td className={`font-bold font-mono ${trade.profitPercent >= 0 ? 'text-profit' : 'text-loss'}`}>{formatPercent(trade.profitPercent)}</td>
                            <td><span className="border-2 border-black px-3 py-1 text-xs font-bold uppercase">{trade.category}</span></td>
                            <td>
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(trade)} className="border-2 border-black px-3 py-1 text-xs font-bold uppercase hover:bg-black hover:text-white">EDIT</button>
                                <SharePNL trade={trade} />
                                <button onClick={() => setDeleteConfirmId(trade.id)} className="border-2 border-red-700 text-red-700 px-3 py-1 text-xs font-bold uppercase hover:bg-red-700 hover:text-white">DELETE</button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Active Trades View */
          <>
            {/* Header Actions */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button onClick={() => setShowAddForm(true)} className="brutal-btn">+ ADD TRADE</button>
              <button onClick={fetchLivePrices} disabled={pricesLoading} className="brutal-btn brutal-btn-secondary">
                {pricesLoading ? 'UPDATING...' : '↻ REFRESH PRICES'}
              </button>
              <button onClick={() => setAutoRefresh(!autoRefresh)} className={`brutal-btn ${autoRefresh ? '' : 'brutal-btn-secondary'}`}>
                {autoRefresh ? '● LIVE' : '○ PAUSED'}
              </button>
            </div>

            {/* Stats Summary */}
            {activeTrades.length > 0 && (
              <div className="brutal-section mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-6 border-r-2 border-b-2 md:border-b-0 border-black">
                    <p className="brutal-label">ACTIVE POSITIONS</p>
                    <p className="text-3xl font-bold font-mono">{activeTrades.length}</p>
                  </div>
                  <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
                    <p className="brutal-label">TOTAL INVESTED</p>
                    <p className="text-3xl font-bold font-mono">${activeTrades.reduce((sum, t) => sum + (t.positionSize || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="p-6 border-r-2 border-black">
                    <p className="brutal-label">UNREALIZED P&L</p>
                    {(() => {
                      const totalPnL = activeTrades.reduce((sum, t) => {
                        const currentPrice = livePrices[t.assetName.toUpperCase()] || t.currentPrice
                        return sum + ((currentPrice - t.entryPrice) / t.entryPrice) * t.positionSize
                      }, 0)
                      return <p className={`text-3xl font-bold font-mono ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>{totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}</p>
                    })()}
                  </div>
                  <div className="p-6">
                    <p className="brutal-label">WIN RATE</p>
                    {(() => {
                      const winning = activeTrades.filter(t => (livePrices[t.assetName.toUpperCase()] || t.currentPrice) > t.entryPrice).length
                      return <p className="text-3xl font-bold font-mono">{activeTrades.length > 0 ? ((winning / activeTrades.length) * 100).toFixed(0) : 0}%</p>
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Active Trades Grid */}
            {activeTradesLoading ? (
              <div className="brutal-section p-16 text-center"><p className="brutal-title text-xl">LOADING...</p></div>
            ) : activeTrades.length === 0 ? (
              <div className="brutal-section p-16 text-center">
                <p className="brutal-title text-3xl mb-4">NO ACTIVE TRADES</p>
                <p className="text-gray-600 uppercase text-sm mb-8">Start tracking your open positions</p>
                <button onClick={() => setShowAddForm(true)} className="brutal-btn">+ ADD YOUR FIRST TRADE</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeTrades.map((trade) => (
                  <ActiveTradeCard
                    key={trade.id}
                    trade={trade}
                    livePrice={livePrices[trade.assetName.toUpperCase()]}
                    onViewDetails={() => { setSelectedTrade(trade); setShowDetailModal(true); }}
                    onClosePosition={() => { setTradeToClose(trade); setShowCloseModal(true); }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} currentUser={currentUser} userProfile={userProfile} />
      
      {showAddForm && <AddActiveTradeForm onClose={() => setShowAddForm(false)} userId={currentUser?.uid} />}
      
      {showDetailModal && selectedTrade && (
        <ActiveTradeDetailModal
          trade={selectedTrade}
          onClose={() => { setShowDetailModal(false); setSelectedTrade(null); }}
          onClosePosition={() => { setShowDetailModal(false); setTradeToClose(selectedTrade); setShowCloseModal(true); }}
        />
      )}
      
      {showCloseModal && tradeToClose && (
        <ClosePositionModal trade={tradeToClose} onClose={() => { setShowCloseModal(false); setTradeToClose(null); }} userId={currentUser?.uid} />
      )}
    </AppLayout>
  )
}

export default TradesPage

