import { useState } from 'react'
import { X } from 'lucide-react'
import { addActiveTrade, calculateRiskReward } from '../services/activeTradesService'

function AddActiveTradeForm({ onClose, userId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    assetName: '',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    positionSize: '',
    whyCanWin: '',
    whyCanFail: '',
    chartLink: '',
    category: 'Fibonacci'
  })

  // Calculate R:R in real-time
  const riskReward = formData.entryPrice && formData.targetPrice && formData.stopLoss
    ? calculateRiskReward(
        parseFloat(formData.entryPrice),
        parseFloat(formData.targetPrice),
        parseFloat(formData.stopLoss)
      )
    : 0

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.assetName.trim()) {
      setError('Please enter an asset name')
      return
    }

    const entry = parseFloat(formData.entryPrice)
    const target = parseFloat(formData.targetPrice)
    const stop = parseFloat(formData.stopLoss)
    const size = parseFloat(formData.positionSize)

    if (isNaN(entry) || entry <= 0) {
      setError('Please enter a valid entry price')
      return
    }
    if (isNaN(target) || target <= 0) {
      setError('Please enter a valid target price')
      return
    }
    if (isNaN(stop) || stop <= 0) {
      setError('Please enter a valid stop loss')
      return
    }
    if (isNaN(size) || size <= 0) {
      setError('Please enter a valid position size')
      return
    }
    if (stop >= entry) {
      setError('Stop loss must be below entry price')
      return
    }
    if (target <= entry) {
      setError('Target price must be above entry price')
      return
    }
    if (!formData.whyCanWin.trim()) {
      setError('Please enter why this trade can win')
      return
    }
    if (!formData.whyCanFail.trim()) {
      setError('Please enter why this trade can fail')
      return
    }

    setLoading(true)

    const tradeData = {
      assetName: formData.assetName.trim().toUpperCase(),
      entryPrice: entry,
      targetPrice: target,
      stopLoss: stop,
      positionSize: size,
      whyCanWin: formData.whyCanWin.trim(),
      whyCanFail: formData.whyCanFail.trim(),
      chartLink: formData.chartLink.trim(),
      category: formData.category,
      entryDate: new Date().toISOString()
    }

    const result = await addActiveTrade(tradeData, userId)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Failed to add trade')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Add Active Trade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Name / Ticker *
            </label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleChange}
              placeholder="e.g., SOL, BONK, WIF"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 uppercase"
            />
          </div>

          {/* Price Inputs - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entry Price (USD) *
              </label>
              <input
                type="number"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Price (USD) *
              </label>
              <input
                type="number"
                name="targetPrice"
                value={formData.targetPrice}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stop Loss (USD) *
              </label>
              <input
                type="number"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Risk/Reward Display */}
          {riskReward > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Risk/Reward Ratio:</span>
              <span className={`font-bold ${riskReward >= 2 ? 'text-green-400' : riskReward >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                R:R {riskReward.toFixed(2)}:1
              </span>
              {riskReward >= 2 && <span className="text-xs text-green-400 ml-2">✓ Good R:R</span>}
            </div>
          )}

          {/* Position Size and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Size (USD) *
              </label>
              <input
                type="number"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="How much capital invested"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="Fibonacci">Fibonacci</option>
                <option value="Degen">Degen</option>
                <option value="Conviction">Conviction</option>
              </select>
            </div>
          </div>

          {/* Chart Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chart Link
            </label>
            <input
              type="url"
              name="chartLink"
              value={formData.chartLink}
              onChange={handleChange}
              placeholder="https://dexscreener.com/... or TradingView link"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            />
          </div>

          {/* Thesis - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Why This Can Win *
              </label>
              <textarea
                name="whyCanWin"
                value={formData.whyCanWin}
                onChange={handleChange}
                rows={4}
                placeholder="Bull case: catalysts, technicals, fundamentals..."
                className="w-full px-4 py-3 bg-gray-800 border border-green-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-400 mb-2">
                Why This Can Fail *
              </label>
              <textarea
                name="whyCanFail"
                value={formData.whyCanFail}
                onChange={handleChange}
                rows={4}
                placeholder="Bear case: risks, invalidation points, concerns..."
                className="w-full px-4 py-3 bg-gray-800 border border-red-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddActiveTradeForm

