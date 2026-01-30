import { useMemo } from 'react'

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
      <h2 className="brutal-title text-2xl mb-6">WIN RATE ANALYSIS</h2>

      {/* Overall Win Rate */}
      <div className="border-6 border-black mb-8">
        <div className="border-b-2 border-black p-4">
          <h3 className="brutal-title text-xl">OVERALL PERFORMANCE</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="p-4 border-r-2 border-b-2 md:border-b-0 border-black">
            <p className="brutal-label">WIN RATE</p>
            <p className="text-3xl font-bold font-mono text-profit">
              {stats.overallWinRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
            <p className="brutal-label">TOTAL WINS</p>
            <p className="text-2xl font-bold font-mono text-profit">{stats.totalWins}</p>
          </div>
          <div className="p-4 border-r-2 border-black">
            <p className="brutal-label">TOTAL LOSSES</p>
            <p className="text-2xl font-bold font-mono text-loss">{stats.totalLosses}</p>
          </div>
          <div className="p-4">
            <p className="brutal-label">TOTAL TRADES</p>
            <p className="text-2xl font-bold font-mono">{stats.totalTrades}</p>
          </div>
        </div>
        {stats.totalTrades > 0 && (
          <div className="h-4 flex border-t-2 border-black">
            <div 
              className="bg-profit h-full"
              style={{ width: `${stats.overallWinRate}%` }}
            />
            <div 
              className="bg-loss h-full"
              style={{ width: `${100 - stats.overallWinRate}%` }}
            />
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="brutal-title text-xl mb-4">PERFORMANCE BY CATEGORY</h3>
        <div className="space-y-4">
          {categories.length > 0 ? (
            categories.map(category => {
              const categoryData = stats.categoryStats[category]
              return (
                <div key={category} className="border-2 border-black">
                  <div className="flex items-center justify-between p-4 border-b-2 border-black">
                    <h4 className="font-bold uppercase">{category}</h4>
                    <span className="text-sm font-mono">{categoryData.total} TRADES</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4">
                    <div className="p-4 border-r border-b md:border-b-0 border-black">
                      <p className="brutal-label">WIN RATE</p>
                      <p className={`text-xl font-bold font-mono ${categoryData.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                        {categoryData.winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 border-b md:border-b-0 md:border-r border-black">
                      <p className="brutal-label">WINS</p>
                      <p className="text-lg font-bold font-mono text-profit">{categoryData.wins}</p>
                    </div>
                    <div className="p-4 border-r border-black">
                      <p className="brutal-label">LOSSES</p>
                      <p className="text-lg font-bold font-mono text-loss">{categoryData.losses}</p>
                    </div>
                    <div className="p-4">
                      <p className="brutal-label">NET P&L</p>
                      <p className={`text-lg font-bold font-mono ${categoryData.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(categoryData.profit)}
                      </p>
                    </div>
                  </div>

                  {categoryData.total > 0 && (
                    <div className="h-3 flex border-t-2 border-black">
                      <div 
                        className="bg-profit h-full"
                        style={{ width: `${categoryData.winRate}%` }}
                      />
                      <div 
                        className="bg-loss h-full"
                        style={{ width: `${100 - categoryData.winRate}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="border-2 border-black p-8 text-center">
              <p className="font-bold uppercase">NO TRADES TO ANALYZE YET</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WinRateStats
