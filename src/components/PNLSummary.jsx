import { useMemo } from 'react'

const PNLSummary = ({ trades = [] }) => {
  const safeTrades = Array.isArray(trades) ? trades : []

  const stats = useMemo(() => {
    let totalProfit = 0
    let totalLoss = 0
    let winningTrades = 0
    let losingTrades = 0
    let totalTrades = safeTrades.length
    let bestTrade = { profit: -Infinity, coinName: '', date: null }
    let worstTrade = { profit: Infinity, coinName: '', date: null }
    let totalEntry = 0
    let totalExit = 0

    safeTrades.forEach(trade => {
      const profit = parseFloat(trade.profitUSD) || 0
      totalEntry += parseFloat(trade.entrySize) || 0
      totalExit += parseFloat(trade.exitSize) || 0

      if (profit > 0) {
        totalProfit += profit
        winningTrades++
        if (profit > bestTrade.profit) {
          bestTrade = {
            profit,
            coinName: trade.coinName || 'Unknown',
            date: trade.date
          }
        }
      } else if (profit < 0) {
        totalLoss += Math.abs(profit)
        losingTrades++
        if (profit < worstTrade.profit) {
          worstTrade = {
            profit,
            coinName: trade.coinName || 'Unknown',
            date: trade.date
          }
        }
      }
    })

    const netProfit = totalProfit - totalLoss
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0
    const roi = totalEntry > 0 ? ((totalExit - totalEntry) / totalEntry) * 100 : 0

    return {
      netProfit,
      totalProfit,
      totalLoss,
      winningTrades,
      losingTrades,
      totalTrades,
      winRate,
      avgWin,
      avgLoss,
      roi,
      bestTrade,
      worstTrade,
      totalEntry,
      totalExit
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

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div>
      <h2 className="brutal-title text-2xl mb-6">OVERALL PNL SUMMARY</h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-6 border-black mb-8">
        <div className="p-6 border-r-2 border-b-2 md:border-b-0 border-black">
          <p className="brutal-label">NET P&L</p>
          <p className={`text-2xl font-bold font-mono ${stats.netProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCurrency(stats.netProfit)}
          </p>
        </div>

        <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
          <p className="brutal-label">ROI</p>
          <p className={`text-2xl font-bold font-mono ${stats.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatPercent(stats.roi)}
          </p>
        </div>

        <div className="p-6 border-r-2 border-black">
          <p className="brutal-label">WIN RATE</p>
          <p className="text-2xl font-bold font-mono">
            {stats.winRate.toFixed(1)}%
          </p>
        </div>

        <div className="p-6">
          <p className="brutal-label">TOTAL TRADES</p>
          <p className="text-2xl font-bold font-mono">
            {stats.totalTrades}
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Wins */}
        <div className="border-2 border-green-700">
          <div className="p-4 border-b-2 border-green-700 bg-green-50">
            <h3 className="brutal-label text-profit">WINNING TRADES</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">TOTAL WINS</span>
              <span className="font-mono font-bold">{stats.winningTrades}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">TOTAL PROFIT</span>
              <span className="font-mono font-bold text-profit">{formatCurrency(stats.totalProfit)}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">AVERAGE WIN</span>
              <span className="font-mono font-bold text-profit">{formatCurrency(stats.avgWin)}</span>
            </div>
            {stats.bestTrade.profit !== -Infinity && (
              <div className="pt-2">
                <p className="brutal-label">BEST TRADE</p>
                <p className="font-mono font-bold text-profit">{formatCurrency(stats.bestTrade.profit)}</p>
                <p className="text-sm text-gray-600">{stats.bestTrade.coinName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Losses */}
        <div className="border-2 border-red-700">
          <div className="p-4 border-b-2 border-red-700 bg-red-50">
            <h3 className="brutal-label text-loss">LOSING TRADES</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">TOTAL LOSSES</span>
              <span className="font-mono font-bold">{stats.losingTrades}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">TOTAL LOSS</span>
              <span className="font-mono font-bold text-loss">{formatCurrency(stats.totalLoss)}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-2">
              <span className="font-bold uppercase text-sm">AVERAGE LOSS</span>
              <span className="font-mono font-bold text-loss">{formatCurrency(stats.avgLoss)}</span>
            </div>
            {stats.worstTrade.profit !== Infinity && (
              <div className="pt-2">
                <p className="brutal-label">WORST TRADE</p>
                <p className="font-mono font-bold text-loss">{formatCurrency(stats.worstTrade.profit)}</p>
                <p className="text-sm text-gray-600">{stats.worstTrade.coinName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capital Stats */}
      <div className="border-2 border-black">
        <div className="p-4 border-b-2 border-black">
          <h3 className="brutal-label">CAPITAL OVERVIEW</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="p-4 border-r border-black">
            <p className="brutal-label">TOTAL ENTRY</p>
            <p className="text-xl font-bold font-mono">{formatCurrency(stats.totalEntry)}</p>
          </div>
          <div className="p-4 border-r border-black">
            <p className="brutal-label">TOTAL EXIT</p>
            <p className="text-xl font-bold font-mono">{formatCurrency(stats.totalExit)}</p>
          </div>
          <div className="p-4">
            <p className="brutal-label">NET RETURN</p>
            <p className={`text-xl font-bold font-mono ${stats.netProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(stats.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PNLSummary
