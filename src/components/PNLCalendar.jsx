import { useState, useMemo } from 'react'

const PNLCalendar = ({ trades = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const safeTrades = Array.isArray(trades) ? trades : []

  const formatCurrency = (value) => {
    if (isNaN(value) || value === null || value === undefined) {
      return '$0'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const dailySummaries = useMemo(() => {
    const summaries = {}
    
    if (!Array.isArray(safeTrades)) {
      return summaries
    }
    
    safeTrades.forEach(trade => {
      if (!trade || !trade.date) return
      
      try {
        const tradeDate = new Date(trade.date)
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

  const monthStats = useMemo(() => {
    try {
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
      
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const monthDays = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const summary = dailySummaries[dateKey] || { total: 0, trades: 0 }
        const total = parseFloat(summary.total) || 0
        
        if (total > 0) {
          totalProfit += total
          winningDays++
          positiveStreak++
          maxPositiveStreak = Math.max(maxPositiveStreak, positiveStreak)
        } else if (total < 0) {
          totalLoss += Math.abs(total)
          losingDays++
          positiveStreak = 0
        } else {
          positiveStreak = 0
        }
        
        if (total > bestDay.amount) {
          bestDay = { date: dateKey, amount: total }
        }
        if (total < worstDay.amount) {
          worstDay = { date: dateKey, amount: total }
        }
        
        monthDays.push({ date: dateKey, day, total })
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
    } catch (error) {
      console.error('Error calculating month stats:', error)
      return {
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        winningDays: 0,
        losingDays: 0,
        bestDay: { date: null, amount: -Infinity },
        worstDay: { date: null, amount: Infinity },
        maxPositiveStreak: 0,
        monthDays: []
      }
    }
  }, [currentMonth, dailySummaries])

  const calendarDays = useMemo(() => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const firstDayOfWeek = firstDay.getDay()
      const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const days = []
      
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({ day: null, date: null, summary: null })
      }
      
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

  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  const navigateMonth = (direction) => {
    try {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
    } catch (error) {
      console.error('Error navigating month:', error)
    }
  }

  if (!monthStats || !calendarDays) {
    return <div className="text-center py-12 font-bold uppercase">LOADING...</div>
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="border-6 border-black mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="p-6 border-r-2 border-b-2 md:border-b-0 border-black">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">NET P&L</p>
            <p className={`text-3xl font-bold font-mono ${monthStats.netProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(monthStats.netProfit)}
            </p>
          </div>
          <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">WINS</p>
            <p className="text-2xl font-bold text-profit">
              {monthStats.winningDays} DAYS
            </p>
            <p className="text-sm font-mono text-profit">{formatCurrency(monthStats.totalProfit)}</p>
          </div>
          <div className="p-6 border-r-2 border-black">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">LOSSES</p>
            <p className="text-2xl font-bold text-loss">
              {monthStats.losingDays} DAYS
            </p>
            <p className="text-sm font-mono text-loss">-{formatCurrency(monthStats.totalLoss)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">WIN RATE</p>
            <p className="text-3xl font-bold font-mono">
              {monthStats.winningDays + monthStats.losingDays > 0 
                ? ((monthStats.winningDays / (monthStats.winningDays + monthStats.losingDays)) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>
        
        {/* Win/Loss Bar */}
        {monthStats.winningDays + monthStats.losingDays > 0 && (
          <div className="h-4 flex border-t-2 border-black">
            <div 
              className="bg-profit h-full"
              style={{ width: `${(monthStats.winningDays / (monthStats.winningDays + monthStats.losingDays)) * 100}%` }}
            />
            <div 
              className="bg-loss h-full"
              style={{ width: `${(monthStats.losingDays / (monthStats.winningDays + monthStats.losingDays)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 border-6 border-black">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-4 hover:bg-black hover:text-white transition-colors font-bold text-2xl border-r-2 border-black"
        >
          ←
        </button>
        <h3 className="brutal-title text-xl md:text-2xl text-center flex-1 py-4">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-4 hover:bg-black hover:text-white transition-colors font-bold text-2xl border-l-2 border-black"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border-6 border-black">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b-2 border-black">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-bold py-3 border-r border-black last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calendarDay, index) => {
            if (calendarDay.day === null) {
              return <div key={`empty-${index}`} className="aspect-square border-r border-b border-black last:border-r-0 bg-gray-50" />
            }
            
            const { day, summary } = calendarDay
            const total = summary?.total || 0
            const tradesCount = summary?.trades || 0
            
            let bgColor = 'bg-white'
            let textColor = 'text-black'
            
            if (total > 0) {
              bgColor = 'bg-profit'
              textColor = 'text-white'
            } else if (total < 0) {
              bgColor = 'bg-loss'
              textColor = 'text-white'
            }
            
            return (
              <div
                key={day}
                className={`aspect-square border-r border-b border-black last:border-r-0 p-2 flex flex-col items-center justify-center ${bgColor} ${textColor} transition-all hover:opacity-80`}
              >
                <div className="text-xs font-bold mb-1">{day}</div>
                {total !== 0 && (
                  <>
                    <div className="text-xs md:text-sm font-bold font-mono">
                      {formatCurrency(total)}
                    </div>
                    {tradesCount > 1 && (
                      <div className="text-[10px] opacity-70 mt-0.5">
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
      <div className="border-6 border-black border-t-0">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {monthStats.bestDay.date && monthStats.bestDay.amount > -Infinity && (
            <div className="p-4 border-r border-black">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">BEST DAY</p>
              <p className="text-sm font-mono text-profit">
                {new Date(monthStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold font-mono text-profit">
                {formatCurrency(monthStats.bestDay.amount)}
              </p>
            </div>
          )}
          {monthStats.worstDay.date && monthStats.worstDay.amount < Infinity && (
            <div className="p-4 border-r border-black">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">WORST DAY</p>
              <p className="text-sm font-mono text-loss">
                {new Date(monthStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold font-mono text-loss">
                {formatCurrency(monthStats.worstDay.amount)}
              </p>
            </div>
          )}
          <div className="p-4 border-r border-black">
            <p className="text-xs font-bold uppercase tracking-wider mb-1">AVG DAILY P&L</p>
            <p className={`text-lg font-bold font-mono ${monthStats.monthDays.length > 0 ? (monthStats.netProfit / monthStats.monthDays.length >= 0 ? 'text-profit' : 'text-loss') : ''}`}>
              {monthStats.monthDays.length > 0 
                ? formatCurrency(monthStats.netProfit / monthStats.monthDays.length)
                : formatCurrency(0)}
            </p>
          </div>
          {monthStats.maxPositiveStreak > 0 && (
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">BEST STREAK</p>
              <p className="text-lg font-bold font-mono text-profit">
                {monthStats.maxPositiveStreak} {monthStats.maxPositiveStreak === 1 ? 'DAY' : 'DAYS'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PNLCalendar
