import { useState } from 'react'
import { Eye, X as CloseIcon, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react'
import { updateCurrentPrice, calculateUnrealizedPnL, calculateUnrealizedPnLPercent, calculateRiskReward } from '../services/activeTradesService'

function ActiveTradeCard({ trade, livePrice, onViewDetails, onClosePosition }) {
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [newPrice, setNewPrice] = useState(trade.currentPrice?.toString() || '')
  const [updating, setUpdating] = useState(false)

  // Use live price if available, otherwise fall back to stored currentPrice
  const displayPrice = livePrice || trade.currentPrice
  const hasLivePrice = livePrice !== undefined

  // Calculate P&L using display price
  const unrealizedPnL = calculateUnrealizedPnL(trade.entryPrice, displayPrice, trade.positionSize)
  const unrealizedPnLPercent = calculateUnrealizedPnLPercent(trade.entryPrice, displayPrice)
  const riskReward = calculateRiskReward(trade.entryPrice, trade.targetPrice, trade.stopLoss)
  const isProfit = unrealizedPnL >= 0

  // Calculate days held
  const daysHeld = Math.floor((new Date() - new Date(trade.entryDate)) / (1000 * 60 * 60 * 24))
  const daysText = daysHeld === 0 ? 'Today' : daysHeld === 1 ? '1 day ago' : `${daysHeld} days ago`

  // Calculate position on progress bar (Stop Loss to Target range)
  const range = trade.targetPrice - trade.stopLoss
  const currentPosition = ((displayPrice - trade.stopLoss) / range) * 100
  const entryPosition = ((trade.entryPrice - trade.stopLoss) / range) * 100

  // Category colors
  const categoryColors = {
    'Fibonacci': 'bg-purple-600 text-purple-100',
    'Degen': 'bg-orange-600 text-orange-100',
    'Conviction': 'bg-blue-600 text-blue-100'
  }

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
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{trade.assetName}</h3>
            <p className="text-sm text-gray-400">{daysText}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[trade.category] || 'bg-gray-600 text-gray-100'}`}>
              {trade.category}
            </span>
            <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-300">
              R:R {riskReward.toFixed(1)}:1
            </span>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Entry</p>
            <p className="text-white font-medium">{formatPrice(trade.entryPrice)}</p>
          </div>
          <div>
            <p className="text-gray-500 flex items-center gap-1">
              Current
              {hasLivePrice && (
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Live price" />
              )}
            </p>
            <p className={`font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatPrice(displayPrice)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Target</p>
            <p className="text-green-400 font-medium">{formatPrice(trade.targetPrice)}</p>
          </div>
          <div>
            <p className="text-gray-500">Stop Loss</p>
            <p className="text-red-400 font-medium">{formatPrice(trade.stopLoss)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>SL</span>
            <span>Target</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
            {/* Red zone (below entry) */}
            <div 
              className="absolute h-full bg-red-900/50"
              style={{ width: `${Math.min(Math.max(entryPosition, 0), 100)}%` }}
            />
            {/* Green zone (above entry) */}
            <div 
              className="absolute h-full bg-green-900/50"
              style={{ 
                left: `${Math.min(Math.max(entryPosition, 0), 100)}%`,
                width: `${100 - Math.min(Math.max(entryPosition, 0), 100)}%`
              }}
            />
            {/* Entry marker */}
            <div 
              className="absolute w-0.5 h-full bg-white"
              style={{ left: `${Math.min(Math.max(entryPosition, 0), 100)}%` }}
            />
            {/* Current position marker */}
            <div 
              className={`absolute w-3 h-3 rounded-full -top-0.5 transform -translate-x-1/2 ${isProfit ? 'bg-green-400' : 'bg-red-400'}`}
              style={{ left: `${Math.min(Math.max(currentPosition, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* P&L Section */}
      <div className={`p-4 ${isProfit ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Unrealized P&L</p>
            <p className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{formatCurrency(unrealizedPnL)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Position Size</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(trade.positionSize)}</p>
          </div>
          <div className={`px-3 py-1 rounded-lg ${isProfit ? 'bg-green-600' : 'bg-red-600'}`}>
            <p className="text-lg font-bold text-white">
              {isProfit ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Update Price Modal Inline */}
      {showPriceUpdate && (
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex gap-2">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="New price"
              step="any"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handlePriceUpdate}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {updating ? '...' : 'Update'}
            </button>
            <button
              onClick={() => setShowPriceUpdate(false)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 flex gap-2">
        <button
          onClick={() => setShowPriceUpdate(true)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Update Price
        </button>
        <button
          onClick={onViewDetails}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
        {trade.chartLink && (
          <a
            href={trade.chartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            title="View Chart"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onClosePosition}
          className="py-2 px-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded-lg transition-colors"
          title="Close Position"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Comments indicator */}
      {trade.comments && trade.comments.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1 text-xs text-gray-500">
          <MessageSquare className="w-3 h-3" />
          {trade.comments.length} comment{trade.comments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default ActiveTradeCard

