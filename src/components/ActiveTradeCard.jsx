import { useState } from 'react'
import { updateCurrentPrice, calculateUnrealizedPnL, calculateUnrealizedPnLPercent, calculateRiskReward } from '../services/activeTradesService'

function ActiveTradeCard({ trade, livePrice, onViewDetails, onClosePosition }) {
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [newPrice, setNewPrice] = useState(trade.currentPrice?.toString() || '')
  const [updating, setUpdating] = useState(false)

  const displayPrice = livePrice || trade.currentPrice
  const hasLivePrice = livePrice !== undefined

  const unrealizedPnL = calculateUnrealizedPnL(trade.entryPrice, displayPrice, trade.positionSize)
  const unrealizedPnLPercent = calculateUnrealizedPnLPercent(trade.entryPrice, displayPrice)
  const riskReward = calculateRiskReward(trade.entryPrice, trade.targetPrice, trade.stopLoss)
  const isProfit = unrealizedPnL >= 0

  const daysHeld = Math.floor((new Date() - new Date(trade.entryDate)) / (1000 * 60 * 60 * 24))
  const daysText = daysHeld === 0 ? 'TODAY' : daysHeld === 1 ? '1 DAY' : `${daysHeld} DAYS`

  const range = trade.targetPrice - trade.stopLoss
  const currentPosition = ((displayPrice - trade.stopLoss) / range) * 100
  const entryPosition = ((trade.entryPrice - trade.stopLoss) / range) * 100

  const handlePriceUpdate = async () => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) return

    setUpdating(true)
    await updateCurrentPrice(trade.id, price, trade.userId)
    setUpdating(false)
    setShowPriceUpdate(false)
  }

  const formatCurrency = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatPrice = (value) => {
    if (value < 0.01) return `$${value.toFixed(6)}`
    if (value < 1) return `$${value.toFixed(4)}`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="brutal-section">
      {/* Header */}
      <div className="border-b-2 border-black p-4 flex items-start justify-between">
        <div>
          <h3 className="brutal-title text-2xl">{trade.assetName}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{daysText}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-2 border-black px-2 py-1 text-xs font-bold uppercase">
            {trade.category}
          </span>
          <span className="border-2 border-black px-2 py-1 text-xs font-bold font-mono">
            R:R {riskReward.toFixed(1)}:1
          </span>
        </div>
      </div>

      {/* Price Section */}
      <div className="p-4 border-b-2 border-black">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="brutal-label">ENTRY</p>
            <p className="font-bold font-mono">{formatPrice(trade.entryPrice)}</p>
          </div>
          <div>
            <p className="brutal-label flex items-center gap-2">
              CURRENT
              {hasLivePrice ? (
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" title="Live price" />
              ) : (
                <span className="text-yellow-600 text-[10px]">MANUAL</span>
              )}
            </p>
            <p className={`font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
              {formatPrice(displayPrice)}
            </p>
          </div>
          <div>
            <p className="brutal-label text-profit">TARGET</p>
            <p className="font-bold font-mono text-profit">{formatPrice(trade.targetPrice)}</p>
          </div>
          <div>
            <p className="brutal-label text-loss">STOP LOSS</p>
            <p className="font-bold font-mono text-loss">{formatPrice(trade.stopLoss)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t-2 border-black">
          <div className="flex justify-between text-xs font-bold uppercase mb-2">
            <span className="text-loss">SL</span>
            <span className="text-profit">TARGET</span>
          </div>
          <div className="h-3 bg-gray-200 relative border-2 border-black">
            <div 
              className="absolute h-full bg-loss"
              style={{ width: `${Math.min(Math.max(entryPosition, 0), 100)}%` }}
            />
            <div 
              className="absolute h-full bg-profit"
              style={{ 
                left: `${Math.min(Math.max(entryPosition, 0), 100)}%`,
                width: `${100 - Math.min(Math.max(entryPosition, 0), 100)}%`
              }}
            />
            {/* Entry marker */}
            <div 
              className="absolute w-1 h-full bg-black"
              style={{ left: `${Math.min(Math.max(entryPosition, 0), 100)}%` }}
            />
            {/* Current position */}
            <div 
              className={`absolute w-4 h-4 rounded-full border-3 border-black -top-0.5 transform -translate-x-1/2 ${isProfit ? 'bg-profit' : 'bg-loss'}`}
              style={{ left: `${Math.min(Math.max(currentPosition, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* P&L Section */}
      <div className={`p-4 border-b-2 border-black ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="brutal-label">UNREALIZED P&L</p>
            <p className={`text-2xl font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
              {isProfit ? '+' : ''}{formatCurrency(unrealizedPnL)}
            </p>
          </div>
          <div className="text-right">
            <p className="brutal-label">POSITION</p>
            <p className="text-lg font-bold font-mono">{formatCurrency(trade.positionSize)}</p>
          </div>
          <div className={`px-4 py-2 ${isProfit ? 'bg-profit' : 'bg-loss'}`}>
            <p className="text-xl font-bold font-mono text-white">
              {isProfit ? '+' : ''}{unrealizedPnLPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Update Price Input */}
      {showPriceUpdate && (
        <div className="p-4 border-b-2 border-black bg-gray-50">
          <div className="flex gap-2">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="New price"
              step="any"
              className="brutal-input flex-1"
              autoFocus
            />
            <button
              onClick={handlePriceUpdate}
              disabled={updating}
              className="brutal-btn text-sm py-2"
            >
              {updating ? '...' : 'UPDATE'}
            </button>
            <button
              onClick={() => setShowPriceUpdate(false)}
              className="brutal-btn brutal-btn-secondary text-sm py-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-4 border-t-0">
        <button
          onClick={() => setShowPriceUpdate(true)}
          className="p-3 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black"
        >
          ↻ PRICE
        </button>
        <button
          onClick={onViewDetails}
          className="p-3 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black"
        >
          DETAILS
        </button>
        {trade.chartLink ? (
          <a
            href={trade.chartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black text-center"
          >
            CHART ↗
          </a>
        ) : (
          <div className="p-3 text-xs font-bold uppercase text-gray-400 border-r-2 border-black text-center">
            NO CHART
          </div>
        )}
        <button
          onClick={onClosePosition}
          className="p-3 text-xs font-bold uppercase text-loss hover:bg-loss hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>

      {/* Comments indicator */}
      {trade.comments && trade.comments.length > 0 && (
        <div className="px-4 py-2 border-t-2 border-black bg-gray-50 text-xs font-bold uppercase">
          💬 {trade.comments.length} COMMENT{trade.comments.length !== 1 ? 'S' : ''}
        </div>
      )}
    </div>
  )
}

export default ActiveTradeCard
