import { useMemo } from 'react'
import { BarChart3, Target } from 'lucide-react'

const WinRateStats = ({ trades = [] }) => {
  const safeTrades = Array.isArray(trades) ? trades : []

  const stats = useMemo(() => {
    const categoryStats = {}
    let totalWins = 0
    let totalLosses = 0

    safeTrades.forEach(trade => {
      const category = trade.category || 'Unknown'
      const profit = parseFloat(trade.profitUSD) || 0

      if (!categoryStats[category]) {
        categoryStats[category] = { wins: 0, losses: 0, total: 0, profit: 0 }
      }

      categoryStats[category].total++
      categoryStats[category].profit += profit

      if (profit > 0) {
        categoryStats[category].wins++
        totalWins++
      } else if (profit < 0) {
        categoryStats[category].losses++
        totalLosses++
      }
    })

    // Calculate win rates
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category]
      stats.winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
    })

    const overallWinRate = safeTrades.length > 0 ? (totalWins / safeTrades.length) * 100 : 0

    return {
      categoryStats,
      overallWinRate,
      totalWins,
      totalLosses,
      totalTrades: safeTrades.length
    }
  }, [safeTrades])

  const formatCurrency = (value) => {
    if (isNaN(value) || value === null || value === undefined) {
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const categories = Object.keys(stats.categoryStats).sort((a, b) => {
    return stats.categoryStats[b].total - stats.categoryStats[a].total
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Win Rate Analysis</h2>

      {/* Overall Win Rate */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Overall Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-green-400">
              {stats.overallWinRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Wins</p>
            <p className="text-2xl font-bold text-green-400">{stats.totalWins}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Losses</p>
            <p className="text-2xl font-bold text-red-400">{stats.totalLosses}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
          </div>
        </div>
        {stats.totalTrades > 0 && (
          <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden flex">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${stats.overallWinRate}%` }}
            ></div>
            <div 
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${100 - stats.overallWinRate}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Performance by Category</h3>
        <div className="space-y-4">
          {categories.length > 0 ? (
            categories.map(category => {
              const categoryData = stats.categoryStats[category]
              return (
                <div key={category} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">{category}</h4>
                    <span className="text-sm text-gray-400">{categoryData.total} trades</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                      <p className={`text-xl font-bold ${categoryData.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {categoryData.winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Wins</p>
                      <p className="text-lg font-semibold text-green-400">{categoryData.wins}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Losses</p>
                      <p className="text-lg font-semibold text-red-400">{categoryData.losses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Net P&L</p>
                      <p className={`text-lg font-semibold ${categoryData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(categoryData.profit)}
                      </p>
                    </div>
                  </div>

                  {categoryData.total > 0 && (
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${categoryData.winRate}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${100 - categoryData.winRate}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No trades to analyze yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WinRateStats

