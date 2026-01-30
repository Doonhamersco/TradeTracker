import { useState, useEffect } from 'react'
import ProfileDropdown from '../components/ProfileDropdown'
import ProfileModal from '../components/ProfileModal'
import SharePNL from '../components/SharePNL'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserTrades, addTrade, updateTrade, deleteTrade } from '../services/tradesService'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const { currentUser, userProfile, signout } = useAuth()
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')

  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isoToDateLocal = (isoString) => {
    if (!isoString) return getCurrentDateString()
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return getCurrentDateString()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    coinName: '',
    entrySize: '',
    exitSize: '',
    category: 'Fibonacci',
    date: getCurrentDateString()
  })

  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setTrades([])
      setLoading(false)
      return
    }

    setLoading(true)
    const userId = currentUser.uid

    const unsubscribe = subscribeToUserTrades(userId, (result) => {
      if (result.success) {
        setTrades(result.trades)
      } else {
        console.error('Error loading trades:', result.error)
        alert('Error loading trades: ' + result.error)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const calculateProfitUSD = (entry, exit) => {
    return parseFloat(exit) - parseFloat(entry)
  }

  const calculateProfitPercent = (entry, exit) => {
    if (parseFloat(entry) === 0) return 0
    return ((parseFloat(exit) - parseFloat(entry)) / parseFloat(entry)) * 100
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.coinName || formData.coinName.trim() === '') {
      alert('Please enter a coin name')
      return
    }
    
    const entry = parseFloat(formData.entrySize)
    const exit = parseFloat(formData.exitSize)

    if (isNaN(entry) || isNaN(exit) || entry <= 0 || exit < 0) {
      alert('Please enter valid positive numbers for Entry Size and Exit Size')
      return
    }

    const profitUSD = calculateProfitUSD(formData.entrySize, formData.exitSize)
    const profitPercent = calculateProfitPercent(formData.entrySize, formData.exitSize)

    let dateISO
    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      dateISO = selectedDate.toISOString()
    } else {
      dateISO = new Date().toISOString()
    }

    const tradeData = {
      coinName: formData.coinName.trim().toUpperCase(),
      entrySize: parseFloat(formData.entrySize),
      exitSize: parseFloat(formData.exitSize),
      profitUSD: profitUSD,
      profitPercent: profitPercent,
      category: formData.category,
      date: dateISO
    }

    if (editingId) {
      const result = await updateTrade(editingId, tradeData, currentUser.uid)
      if (result.success) {
        setEditingId(null)
      } else {
        alert('Error updating trade: ' + result.error)
      }
    } else {
      const result = await addTrade(tradeData, currentUser.uid)
      if (!result.success) {
        alert('Error adding trade: ' + result.error)
      }
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
      date: trade.date ? isoToDateLocal(trade.date) : getCurrentDateString()
    })
    setEditingId(trade.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async (id) => {
    const result = await deleteTrade(id)
    if (result.success) {
      setTrades(trades.filter(trade => trade.id !== id))
      setDeleteConfirmId(null)
      if (editingId === id) {
        setEditingId(null)
        setFormData({
          coinName: '',
          entrySize: '',
          exitSize: '',
          category: 'Fibonacci',
          date: getCurrentDateString()
        })
      }
    } else {
      alert('Error deleting trade: ' + result.error)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      coinName: '',
      entrySize: '',
      exitSize: '',
      category: 'Fibonacci',
      date: getCurrentDateString()
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogout = async () => {
    await signout()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedTrades = [...trades].sort((a, b) => {
    if (!sortColumn) return 0

    let aValue, bValue

    switch (sortColumn) {
      case 'coinName':
        aValue = (a.coinName || '').toLowerCase()
        bValue = (b.coinName || '').toLowerCase()
        break
      case 'date':
        aValue = a.date ? new Date(a.date).getTime() : 0
        bValue = b.date ? new Date(b.date).getTime() : 0
        break
      case 'entrySize':
        aValue = parseFloat(a.entrySize) || 0
        bValue = parseFloat(b.entrySize) || 0
        break
      case 'exitSize':
        aValue = parseFloat(a.exitSize) || 0
        bValue = parseFloat(b.exitSize) || 0
        break
      case 'profitUSD':
        aValue = parseFloat(a.profitUSD) || 0
        bValue = parseFloat(b.profitUSD) || 0
        break
      case 'profitPercent':
        aValue = parseFloat(a.profitPercent) || 0
        bValue = parseFloat(b.profitPercent) || 0
        break
      case 'category':
        aValue = (a.category || '').toLowerCase()
        bValue = (b.category || '').toLowerCase()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ column }) => {
    const isActive = sortColumn === column
    return (
      <span className={`ml-2 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {isActive && sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-6 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center">
            <h1 className="brutal-title text-4xl md:text-6xl lg:text-7xl tracking-tight">
              TRADE TRACKER
            </h1>
            <ProfileDropdown
              currentUser={currentUser}
              userProfile={userProfile}
              onLogout={handleLogout}
              trades={trades}
              onShowPNL={() => navigate('/pnl')}
              onShowProfile={() => setShowProfileModal(true)}
            />
          </div>
          
          {/* Navigation */}
          <div className="flex gap-0 mt-8">
            <button className="brutal-tab brutal-tab-active">
              TRADE HISTORY
            </button>
            <button 
              onClick={() => navigate('/active')}
              className="brutal-tab brutal-tab-inactive"
            >
              ACTIVE TRADES
            </button>
            <button 
              onClick={() => navigate('/pnl')}
              className="brutal-tab brutal-tab-inactive"
            >
              ANALYTICS
            </button>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Add Trade Form */}
        <section className="brutal-section mb-12">
          <div className="border-b-6 border-black px-8 py-4">
            <h2 className="brutal-title text-2xl md:text-3xl">
              {editingId ? 'EDIT TRADE' : 'ADD NEW TRADE'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Coin Name */}
              <div>
                <label className="brutal-label">COIN NAME</label>
                <input
                  type="text"
                  name="coinName"
                  value={formData.coinName}
                  onChange={handleChange}
                  required
                  className="brutal-input"
                  placeholder="SOL, BTC, ETH..."
                />
              </div>
              
              {/* Entry Size */}
              <div>
                <label className="brutal-label">ENTRY SIZE (USD)</label>
                <input
                  type="number"
                  name="entrySize"
                  value={formData.entrySize}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="brutal-input"
                  placeholder="0.00"
                />
              </div>

              {/* Exit Size */}
              <div>
                <label className="brutal-label">EXIT SIZE (USD)</label>
                <input
                  type="number"
                  name="exitSize"
                  value={formData.exitSize}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="brutal-input"
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div>
                <label className="brutal-label">CATEGORY</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="brutal-input"
                >
                  <option value="Fibonacci">FIBONACCI</option>
                  <option value="Degen">DEGEN</option>
                  <option value="Conviction">CONVICTION</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="brutal-label">DATE</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="brutal-input"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 mt-8">
              <button type="submit" className="brutal-btn">
                {editingId ? 'SAVE CHANGES' : 'ADD TRADE'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="brutal-btn brutal-btn-secondary"
                >
                  CANCEL
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Trade History */}
        <section className="brutal-section">
          <div className="border-b-6 border-black px-8 py-4 flex justify-between items-center">
            <h2 className="brutal-title text-2xl md:text-3xl">TRADE HISTORY</h2>
            <span className="text-sm font-mono">{trades.length} TRADES</span>
          </div>
          
          {loading ? (
            <div className="p-16 text-center">
              <p className="brutal-title text-xl">LOADING...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="p-16 text-center">
              <p className="brutal-title text-2xl mb-2">NO TRADES YET</p>
              <p className="text-gray-600 uppercase text-sm tracking-wider">
                Add your first trade using the form above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="brutal-table">
                <thead>
                  <tr>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('coinName')}
                    >
                      COIN <SortIcon column="coinName" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('date')}
                    >
                      DATE <SortIcon column="date" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('entrySize')}
                    >
                      ENTRY <SortIcon column="entrySize" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('exitSize')}
                    >
                      EXIT <SortIcon column="exitSize" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('profitUSD')}
                    >
                      PROFIT (USD) <SortIcon column="profitUSD" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('profitPercent')}
                    >
                      PROFIT (%) <SortIcon column="profitPercent" />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-900 select-none"
                      onClick={() => handleSort('category')}
                    >
                      CATEGORY <SortIcon column="category" />
                    </th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.map((trade) => (
                    deleteConfirmId === trade.id ? (
                      <tr key={trade.id} className="bg-yellow-50">
                        <td colSpan="8" className="!p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <span className="font-bold uppercase text-sm">
                              CONFIRM DELETE THIS TRADE?
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={handleDeleteCancel}
                                className="brutal-btn brutal-btn-secondary text-xs py-2 px-4"
                              >
                                CANCEL
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(trade.id)}
                                className="brutal-btn text-xs py-2 px-4 !bg-red-700 !border-red-700 hover:!bg-white hover:!text-red-700"
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr 
                        key={trade.id} 
                        className={editingId === trade.id ? 'bg-yellow-50' : ''}
                      >
                        <td className="font-bold">{trade.coinName || 'N/A'}</td>
                        <td className="font-mono text-sm">{formatDate(trade.date)}</td>
                        <td className="font-mono">{formatCurrency(trade.entrySize)}</td>
                        <td className="font-mono">{formatCurrency(trade.exitSize)}</td>
                        <td className={`font-bold font-mono ${trade.profitUSD >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {formatCurrency(trade.profitUSD)}
                        </td>
                        <td className={`font-bold font-mono ${trade.profitPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {formatPercent(trade.profitPercent)}
                        </td>
                        <td>
                          <span className="inline-block border-2 border-black px-3 py-1 text-xs font-bold uppercase">
                            {trade.category}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(trade)}
                              className="border-2 border-black px-3 py-1 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
                            >
                              EDIT
                            </button>
                            <SharePNL trade={trade} />
                            <button
                              onClick={() => handleDeleteClick(trade.id)}
                              className="border-2 border-red-700 text-red-700 px-3 py-1 text-xs font-bold uppercase hover:bg-red-700 hover:text-white transition-colors"
                            >
                              DELETE
                            </button>
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
    </div>
  )
}

export default HomePage
