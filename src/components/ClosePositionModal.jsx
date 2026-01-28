import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { closePosition, calculateExitSize } from '../services/activeTradesService'
import { addTrade } from '../services/tradesService'

function ClosePositionModal({ trade, onClose, userId }) {
  const [exitPrice, setExitPrice] = useState(trade.currentPrice?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get current date in format for date input
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [exitDate, setExitDate] = useState(getCurrentDateString())

  // Calculate P&L preview
  const exit = parseFloat(exitPrice) || 0
  const pnlPercent = exit > 0 ? ((exit - trade.entryPrice) / trade.entryPrice) * 100 : 0
  const pnlUSD = exit > 0 ? ((exit - trade.entryPrice) / trade.entryPrice) * trade.positionSize : 0
  const exitSize = exit > 0 ? calculateExitSize(trade.entryPrice, exit, trade.positionSize) : 0
  const isProfit = pnlUSD >= 0

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPrice = (value) => {
    if (value < 0.01) return `$${value.toFixed(6)}`
    if (value < 1) return `$${value.toFixed(4)}`
    return `$${value.toFixed(2)}`
  }

  const handleConfirm = async () => {
    const exitPriceNum = parseFloat(exitPrice)
    
    if (isNaN(exitPriceNum) || exitPriceNum <= 0) {
      setError('Please enter a valid exit price')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Create entry in Trade History
      const exitDateISO = new Date(exitDate + 'T' + new Date().toTimeString().slice(0, 8)).toISOString()
      
      const tradeHistoryData = {
        coinName: trade.assetName,
        entrySize: trade.positionSize,
        exitSize: exitSize,
        profitUSD: pnlUSD,
        profitPercent: pnlPercent,
        category: trade.category,
        date: exitDateISO
      }

      const addResult = await addTrade(tradeHistoryData, userId)
      
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add to trade history')
      }

      // 2. Close the active trade
      const closeResult = await closePosition(trade.id, exitPriceNum, exitDateISO)
      
      if (!closeResult.success) {
        throw new Error(closeResult.error || 'Failed to close position')
      }

      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Close Position</h2>
              <p className="text-gray-400 text-sm">{trade.assetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Trade Summary */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Entry Price</span>
              <span className="text-white font-medium">{formatPrice(trade.entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Position Size</span>
              <span className="text-white font-medium">{formatCurrency(trade.positionSize)}</span>
            </div>
          </div>

          {/* Exit Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exit Price (USD)
            </label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="any"
              min="0"
              placeholder="Enter exit price"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Exit Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exit Date
            </label>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          {/* P&L Preview */}
          {exit > 0 && (
            <div className={`rounded-lg p-4 ${isProfit ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Final P&L Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit/Loss</span>
                  <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(pnlUSD)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L %</span>
                  <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Exit Size</span>
                  <span className="text-white font-medium">{formatCurrency(exitSize)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <p className="text-sm text-gray-500">
            This will add the trade to your Trade History and remove it from Active Trades.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !exitPrice}
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Closing...' : 'Confirm Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClosePositionModal

