import { useState } from 'react'
import DollarBillAnimation from '../DollarBillAnimation'
import ProfileDropdown from '../components/ProfileDropdown'
import ProfileModal from '../components/ProfileModal'
import SharePNL from '../components/SharePNL'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToUserTrades, addTrade, updateTrade, deleteTrade } from '../services/tradesService'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

function HomePage() {
  const { currentUser, userProfile, signout } = useAuth()
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [celebrateProfit, setCelebrateProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sortColumn, setSortColumn] = useState('date') // Default sort by date
  const [sortDirection, setSortDirection] = useState('desc') // 'asc' or 'desc' - most recent first

  // Helper function to get current date in format for date input
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper function to convert ISO date string to date format
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

  const calculateProfitUSD = (entry, exit) => {
    return parseFloat(exit) - parseFloat(entry)
  }

  const calculateProfitPercent = (entry, exit) => {
    if (parseFloat(entry) === 0) return 0
    return ((parseFloat(exit) - parseFloat(entry)) / parseFloat(entry)) * 100
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.coinName || formData.coinName.trim() === '') {
      alert('Please enter a coin name')
      return
    }
    
    const entry = parseFloat(formData.entrySize)
    const exit = parseFloat(formData.exitSize)

    // Validation
    if (isNaN(entry) || isNaN(exit) || entry <= 0 || exit < 0) {
      alert('Please enter valid positive numbers for Entry Size and Exit Size')
      return
    }

    const profitUSD = calculateProfitUSD(formData.entrySize, formData.exitSize)
    const profitPercent = calculateProfitPercent(formData.entrySize, formData.exitSize)

    // For new trades: use selected date + current time for proper sorting
    // For edits: use selected date + current time
    let dateISO
    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const now = new Date()
      // Combine selected date with current time for accurate sorting
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      dateISO = selectedDate.toISOString()
    } else {
      dateISO = new Date().toISOString()
    }

    const tradeData = {
      coinName: formData.coinName.trim(),
      entrySize: parseFloat(formData.entrySize),
      exitSize: parseFloat(formData.exitSize),
      profitUSD: profitUSD,
      profitPercent: profitPercent,
      category: formData.category,
      date: dateISO
    }

    if (editingId) {
      // Update existing trade
      const result = await updateTrade(editingId, tradeData, currentUser.uid)
      if (result.success) {
        setEditingId(null)
      } else {
        alert('Error updating trade: ' + result.error)
      }
    } else {
      // Create new trade
      const result = await addTrade(tradeData, currentUser.uid)
      if (result.success) {
        // Trigger celebration animation for positive profit
        if (profitUSD > 0) {
          setCelebrateProfit(prev => prev + 1)
        }
      } else {
        alert('Error adding trade: ' + result.error)
      }
    }
    
    // Reset form
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
    // Scroll to form
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
      // If deleting the trade being edited, cancel edit mode
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

  // Handle column sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending (highest first)
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Sort trades based on selected column
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

  // Get sort indicator icon
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="inline w-4 h-4 text-gray-500 ml-1" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="inline w-4 h-4 text-blue-400 ml-1" />
      : <ChevronDown className="inline w-4 h-4 text-blue-400 ml-1" />
  }

  return (
    <div className="min-h-screen text-white relative z-10">
      <DollarBillAnimation trigger={celebrateProfit} />
      
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
          style={{ opacity: 0.2 }}
          onError={(e) => {
            console.warn('Background video failed to load.')
            e.target.style.display = 'none'
          }}
        >
          <source src="/trades-vid.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="flex items-start justify-center gap-4 px-4 py-8">
        {/* Left Side Image */}
        <div className="hidden lg:block flex-shrink-0 w-48 xl:w-64 sticky" style={{ top: '200px' }}>
          <img
            src="/character-side.png"
            alt="Character illustration"
            className="w-full h-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            onError={(e) => {
              console.warn('Left side image not found. Please add character-side.png to the public folder.')
              e.target.style.display = 'none'
            }}
          />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
                Trade Tracker
              </h1>
              <p className="text-gray-400 text-lg">Manually track your trades and PNL</p>
            </div>
            <div className="flex-1 flex justify-end">
              <ProfileDropdown
                currentUser={currentUser}
                userProfile={userProfile}
                onLogout={handleLogout}
                trades={trades}
                onShowPNL={() => navigate('/pnl')}
                onShowProfile={() => setShowProfileModal(true)}
              />
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg"
            >
              Trade History
            </button>
            <button
              onClick={() => navigate('/active')}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Active Trades
            </button>
          </div>
        </header>

        {/* Profile Modal */}
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
          userProfile={userProfile}
        />

        {/* Trade Input Form */}
        <div className="bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 mb-8 border border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            {editingId ? 'Edit Trade' : 'Add New Trade'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Coin Name */}
            <div>
              <label htmlFor="coinName" className="block text-sm font-medium text-gray-300 mb-2">
                Coin Name
              </label>
              <input
                type="text"
                id="coinName"
                name="coinName"
                value={formData.coinName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="e.g., SOL, BTC, ETH"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entry Size */}
              <div>
                <label htmlFor="entrySize" className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Size (USD)
                </label>
                <input
                  type="number"
                  id="entrySize"
                  name="entrySize"
                  value={formData.entrySize}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>

              {/* Exit Size */}
              <div>
                <label htmlFor="exitSize" className="block text-sm font-medium text-gray-300 mb-2">
                  Exit Size (USD)
                </label>
                <input
                  type="number"
                  id="exitSize"
                  name="exitSize"
                  value={formData.exitSize}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="Fibonacci">Fibonacci</option>
                  <option value="Degen">Degen</option>
                  <option value="Conviction">Conviction</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {editingId ? 'Save Changes' : 'Add Trade'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Trade History */}
        <div className="bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 border border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 text-white">Trade History</h2>
          
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Loading trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No trades recorded yet.</p>
              <p className="text-sm mt-2">Add your first trade using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('coinName')}
                    >
                      Coin Name {getSortIcon('coinName')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap"
                      onClick={() => handleSort('date')}
                      style={{ minWidth: '140px' }}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('entrySize')}
                    >
                      Entry Size {getSortIcon('entrySize')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('exitSize')}
                    >
                      Exit Size {getSortIcon('exitSize')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('profitUSD')}
                    >
                      Profit (USD) {getSortIcon('profitUSD')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('profitPercent')}
                    >
                      Profit (%) {getSortIcon('profitPercent')}
                    </th>
                    <th 
                      className="text-left py-4 px-4 text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => handleSort('category')}
                    >
                      Category {getSortIcon('category')}
                    </th>
                    <th className="text-left py-4 px-4 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.map((trade) => (
                    deleteConfirmId === trade.id ? (
                      // Delete Confirmation Row
                      <tr key={trade.id} className="border-b border-gray-800 bg-yellow-900/20">
                        <td colSpan="9" className="py-4 px-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <span className="text-yellow-300 font-medium text-sm sm:text-base">Are you sure you want to delete this trade?</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={handleDeleteCancel}
                                className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(trade.id)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                Confirm Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Normal Trade Row
                      <tr key={trade.id} className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${editingId === trade.id ? 'bg-gray-800/30' : ''}`}>
                        <td className="py-4 px-4 text-white font-medium">{trade.coinName || 'N/A'}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{trade.date ? formatDate(trade.date) : 'N/A'}</td>
                        <td className="py-4 px-4 text-white">{formatCurrency(trade.entrySize)}</td>
                        <td className="py-4 px-4 text-white">{formatCurrency(trade.exitSize)}</td>
                        <td className={`py-4 px-4 font-semibold ${trade.profitUSD >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.profitUSD)}
                        </td>
                        <td className={`py-4 px-4 font-semibold ${trade.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(trade.profitPercent)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                            {trade.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(trade)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              title="Edit trade"
                            >
                              Edit
                            </button>
                            <SharePNL trade={trade} />
                            <button
                              onClick={() => handleDeleteClick(trade.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              title="Delete trade"
                            >
                              Delete
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
        </div>
        </div>

        {/* Right Side Image */}
        <div className="hidden lg:block flex-shrink-0 w-48 xl:w-64 sticky" style={{ top: '200px' }}>
          <img
            src="/character-side.png"
            alt="Character illustration"
            className="w-full h-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            style={{ transform: 'scaleX(-1)' }}
            onError={(e) => {
              console.warn('Right side image not found. Please add character-side.png to the public folder.')
              e.target.style.display = 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage

