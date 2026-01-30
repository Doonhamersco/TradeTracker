import { useState } from 'react'
import { closePosition, calculateExitSize } from '../services/activeTradesService'
import { addTrade } from '../services/tradesService'

function ClosePositionModal({ trade, onClose, userId }) {
  const [exitPrice, setExitPrice] = useState(trade.currentPrice?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [exitDate, setExitDate] = useState(getCurrentDateString())

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
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="brutal-section w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-6 border-black p-6 flex items-center justify-between">
          <div>
            <h2 className="brutal-title text-xl">CLOSE POSITION</h2>
            <p className="font-bold">{trade.assetName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 border-2 border-red-700 bg-red-50 text-red-700 text-sm font-bold uppercase">
              {error}
            </div>
          )}

          {/* Trade Summary */}
          <div className="border-2 border-black p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-bold uppercase text-sm">ENTRY PRICE</span>
              <span className="font-mono font-bold">{formatPrice(trade.entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase text-sm">POSITION SIZE</span>
              <span className="font-mono font-bold">{formatCurrency(trade.positionSize)}</span>
            </div>
          </div>

          {/* Exit Price Input */}
          <div>
            <label className="brutal-label">EXIT PRICE (USD)</label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="any"
              min="0"
              placeholder="ENTER EXIT PRICE"
              className="brutal-input"
              autoFocus
            />
          </div>

          {/* Exit Date */}
          <div>
            <label className="brutal-label">EXIT DATE</label>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="brutal-input"
            />
          </div>

          {/* P&L Preview */}
          {exit > 0 && (
            <div className={`p-4 border-2 ${isProfit ? 'border-green-700 bg-green-50' : 'border-red-700 bg-red-50'}`}>
              <h4 className="brutal-label mb-3">FINAL P&L PREVIEW</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold uppercase text-sm">PROFIT/LOSS</span>
                  <span className={`font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(pnlUSD)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold uppercase text-sm">P&L %</span>
                  <span className={`font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-black">
                  <span className="font-bold uppercase text-sm">EXIT SIZE</span>
                  <span className="font-mono font-bold">{formatCurrency(exitSize)}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs font-bold uppercase text-gray-500">
            THIS WILL ADD THE TRADE TO HISTORY AND REMOVE FROM ACTIVE TRADES.
          </p>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 border-t-6 border-black">
          <button
            onClick={onClose}
            className="py-4 font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !exitPrice}
            className="py-4 font-bold uppercase text-loss hover:bg-loss hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CLOSING...' : 'CONFIRM CLOSE'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClosePositionModal
