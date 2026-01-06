import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const PNLModal = ({ isOpen, onClose, trades = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Ensure trades is always an array
  const safeTrades = Array.isArray(trades) ? trades : []

  if (!isOpen) return null

  console.log('PNLModal rendering with trades:', safeTrades.length)

  const formatCurrency = (value) => {
    if (isNaN(value) || value === null || value === undefined) {
      return '$0.0'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value)
  }

  // Process trades into daily summaries
  const dailySummaries = useMemo(() => {
    const summaries = {}
    
    if (!Array.isArray(safeTrades)) {
      return summaries
    }
    
    safeTrades.forEach(trade => {
      if (!trade || !trade.date) return
      
      try {
        // Convert date to YYYY-MM-DD format (local timezone)
        const tradeDate = new Date(trade.date)
        
        // Check if date is valid
        if (isNaN(tradeDate.getTime())) {
          return
        }
        
        const dateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`
        
        if (!summaries[dateKey]) {
          summaries[dateKey] = { total: 0, trades: 0 }
        }
        
        const profit = parseFloat(trade.profitUSD) || 0
        summaries[dateKey].total += profit
        summaries[dateKey].trades += 1
      } catch (error) {
        console.error('Error processing trade:', error, trade)
      }
    })
    
    return summaries
  }, [safeTrades])

  // Get month stats
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    let totalProfit = 0
    let totalLoss = 0
    let winningDays = 0
    let losingDays = 0
    let bestDay = { date: null, amount: -Infinity }
    let worstDay = { date: null, amount: Infinity }
    let positiveStreak = 0
    let maxPositiveStreak = 0
    let currentStreak = 0
    
    // Get all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthDays = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const summary = dailySummaries[dateKey] || { total: 0, trades: 0 }
      
      if (summary.total > 0) {
        totalProfit += summary.total
        winningDays++
        positiveStreak++
        maxPositiveStreak = Math.max(maxPositiveStreak, positiveStreak)
        currentStreak = positiveStreak
      } else if (summary.total < 0) {
        totalLoss += Math.abs(summary.total)
        losingDays++
        positiveStreak = 0
        currentStreak = 0
      } else {
        positiveStreak = 0
        currentStreak = 0
      }
      
      if (summary.total > bestDay.amount) {
        bestDay = { date: dateKey, amount: summary.total }
      }
      if (summary.total < worstDay.amount) {
        worstDay = { date: dateKey, amount: summary.total }
      }
      
      monthDays.push({ date: dateKey, day, summary })
    }
    
    const netProfit = totalProfit - totalLoss
    
    return {
      netProfit,
      totalProfit,
      totalLoss,
      winningDays,
      losingDays,
      bestDay,
      worstDay,
      maxPositiveStreak,
      monthDays
    }
  }, [currentMonth, dailySummaries])

  // Get calendar days for the month
  const calendarDays = useMemo(() => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      // First day of the month
      const firstDay = new Date(year, month, 1)
      const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
      // Adjust to Monday = 0
      const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      
      // Days in the month
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      // Create calendar grid
      const days = []
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({ day: null, date: null, summary: null })
      }
      
      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const summaryData = dailySummaries[dateKey] || { total: 0, trades: 0 }
        const summary = {
          total: parseFloat(summaryData.total) || 0,
          trades: parseInt(summaryData.trades) || 0
        }
        days.push({ day, date: dateKey, summary })
      }
      
      return days
    } catch (error) {
      console.error('Error calculating calendar days:', error)
      return []
    }
  }, [currentMonth, dailySummaries])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const navigateMonth = (direction) => {
    try {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
    } catch (error) {
      console.error('Error navigating month:', error)
    }
  }

  // Safety check - ensure monthStats and calendarDays are defined
  if (!monthStats || !calendarDays) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-md p-6">
          <p className="text-white">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">PNL Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h3 className="text-xl font-semibold text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Net P&L</p>
              <p className={`text-2xl font-bold ${monthStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(monthStats.netProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Wins</p>
              <p className="text-lg font-semibold text-green-400">
                {monthStats.winningDays} / {formatCurrency(monthStats.totalProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Losses</p>
              <p className="text-lg font-semibold text-red-400">
                {monthStats.losingDays} / {formatCurrency(monthStats.totalLoss)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-lg font-semibold text-white">
                {monthStats.winningDays + monthStats.losingDays > 0 
                  ? ((monthStats.winningDays / (monthStats.winningDays + monthStats.losingDays)) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
          
          {/* Visual bar showing wins vs losses */}
          {monthStats.winningDays + monthStats.losingDays > 0 && (
            <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden flex">
              <div 
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${(monthStats.winningDays / (monthStats.winningDays + monthStats.losingDays)) * 100}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${(monthStats.losingDays / (monthStats.winningDays + monthStats.losingDays)) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((calendarDay, index) => {
              if (calendarDay.day === null) {
                return <div key={`empty-${index}`} className="aspect-square"></div>
              }
              
              const { day, summary } = calendarDay
              const total = summary?.total || 0
              const tradesCount = summary?.trades || 0
              
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border border-gray-700 p-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 hover:border-gray-600 ${
                    total > 0 
                      ? `bg-green-500/20 border-green-500/30` 
                      : total < 0 
                      ? `bg-red-500/20 border-red-500/30` 
                      : 'bg-gray-800/50'
                  }`}
                  style={{
                    backgroundColor: total > 0 
                      ? `rgba(34, 197, 94, ${0.2 + Math.min(Math.abs(total) / 500, 1) * 0.3})`
                      : total < 0
                      ? `rgba(239, 68, 68, ${0.2 + Math.min(Math.abs(total) / 500, 1) * 0.3})`
                      : 'rgba(31, 41, 55, 0.5)'
                  }}
                >
                  <div className="text-xs text-gray-400 mb-1">{day}</div>
                  {total !== 0 && (
                    <>
                      <div className={`text-xs font-semibold ${total > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatCurrency(total)}
                      </div>
                      {tradesCount > 1 && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {tradesCount} trades
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {monthStats.bestDay.date && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Best Day</p>
                <p className="text-sm font-semibold text-green-400">
                  {new Date(monthStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-lg font-bold text-green-400">
                  {formatCurrency(monthStats.bestDay.amount)}
                </p>
              </div>
            )}
            {monthStats.worstDay.date && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Worst Day</p>
                <p className="text-sm font-semibold text-red-400">
                  {new Date(monthStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-lg font-bold text-red-400">
                  {formatCurrency(monthStats.worstDay.amount)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Daily P&L</p>
              <p className={`text-lg font-bold ${monthStats.monthDays.length > 0 ? (monthStats.netProfit / monthStats.monthDays.length >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                {monthStats.monthDays.length > 0 
                  ? formatCurrency(monthStats.netProfit / monthStats.monthDays.length)
                  : formatCurrency(0)}
              </p>
            </div>
            {monthStats.maxPositiveStreak > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Best Positive Streak</p>
                <p className="text-lg font-bold text-green-400">
                  {monthStats.maxPositiveStreak} {monthStats.maxPositiveStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PNLModal
