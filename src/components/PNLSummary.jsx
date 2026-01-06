import { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

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
      <h2 className="text-2xl font-bold text-white mb-6">Overall PNL Summary</h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <p className="text-xs text-gray-400">Net P&L</p>
          </div>
          <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.netProfit)}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-blue-400" />
            <p className="text-xs text-gray-400">ROI</p>
          </div>
          <p className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(stats.roi)}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.winRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <p className="text-xs text-gray-400">Total Trades</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.totalTrades}
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Wins */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-4">Winning Trades</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Wins</span>
              <span className="text-white font-semibold">{stats.winningTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Profit</span>
              <span className="text-green-400 font-semibold">{formatCurrency(stats.totalProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Win</span>
              <span className="text-green-400 font-semibold">{formatCurrency(stats.avgWin)}</span>
            </div>
            {stats.bestTrade.profit !== -Infinity && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Best Trade</p>
                <p className="text-green-400 font-semibold">{formatCurrency(stats.bestTrade.profit)}</p>
                <p className="text-sm text-gray-400">{stats.bestTrade.coinName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Losses */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Losing Trades</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Losses</span>
              <span className="text-white font-semibold">{stats.losingTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Loss</span>
              <span className="text-red-400 font-semibold">{formatCurrency(stats.totalLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Loss</span>
              <span className="text-red-400 font-semibold">{formatCurrency(stats.avgLoss)}</span>
            </div>
            {stats.worstTrade.profit !== Infinity && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Worst Trade</p>
                <p className="text-red-400 font-semibold">{formatCurrency(stats.worstTrade.profit)}</p>
                <p className="text-sm text-gray-400">{stats.worstTrade.coinName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capital Stats */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Capital Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Entry</p>
            <p className="text-xl font-bold text-white">{formatCurrency(stats.totalEntry)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Exit</p>
            <p className="text-xl font-bold text-white">{formatCurrency(stats.totalExit)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Net Return</p>
            <p className={`text-xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(stats.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PNLSummary

