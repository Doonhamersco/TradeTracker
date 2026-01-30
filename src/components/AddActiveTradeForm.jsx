import { useState } from 'react'
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
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="brutal-section w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-6 border-black p-6 flex items-center justify-between">
          <h2 className="brutal-title text-2xl">ADD ACTIVE TRADE</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 border-2 border-red-700 bg-red-50 text-red-700 text-sm font-bold uppercase">
              {error}
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label className="brutal-label">ASSET NAME / TICKER *</label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleChange}
              placeholder="E.G., SOL, BONK, WIF"
              className="brutal-input uppercase"
            />
          </div>

          {/* Price Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="brutal-label">ENTRY PRICE (USD) *</label>
              <input
                type="number"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="brutal-input"
              />
            </div>
            <div>
              <label className="brutal-label text-profit">TARGET PRICE (USD) *</label>
              <input
                type="number"
                name="targetPrice"
                value={formData.targetPrice}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="brutal-input border-green-700"
              />
            </div>
            <div>
              <label className="brutal-label text-loss">STOP LOSS (USD) *</label>
              <input
                type="number"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className="brutal-input border-red-700"
              />
            </div>
          </div>

          {/* Risk/Reward Display */}
          {riskReward > 0 && (
            <div className="p-4 border-2 border-black flex items-center justify-between">
              <span className="font-bold uppercase text-sm">RISK/REWARD RATIO:</span>
              <span className={`font-bold font-mono text-xl ${riskReward >= 2 ? 'text-profit' : riskReward >= 1 ? 'text-yellow-600' : 'text-loss'}`}>
                R:R {riskReward.toFixed(2)}:1
              </span>
              {riskReward >= 2 && <span className="text-xs font-bold text-profit">✓ GOOD R:R</span>}
            </div>
          )}

          {/* Position Size and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="brutal-label">POSITION SIZE (USD) *</label>
              <input
                type="number"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="CAPITAL INVESTED"
                className="brutal-input"
              />
            </div>
            <div>
              <label className="brutal-label">CATEGORY *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="brutal-input"
              >
                <option value="Fibonacci">FIBONACCI</option>
                <option value="Degen">DEGEN</option>
                <option value="Conviction">CONVICTION</option>
              </select>
            </div>
          </div>

          {/* Chart Link */}
          <div>
            <label className="brutal-label">CHART LINK</label>
            <input
              type="url"
              name="chartLink"
              value={formData.chartLink}
              onChange={handleChange}
              placeholder="HTTPS://DEXSCREENER.COM/..."
              className="brutal-input"
            />
          </div>

          {/* Thesis - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="brutal-label text-profit">WHY THIS CAN WIN *</label>
              <textarea
                name="whyCanWin"
                value={formData.whyCanWin}
                onChange={handleChange}
                rows={4}
                placeholder="BULL CASE: CATALYSTS, TECHNICALS..."
                className="brutal-input resize-none border-green-700"
              />
            </div>
            <div>
              <label className="brutal-label text-loss">WHY THIS CAN FAIL *</label>
              <textarea
                name="whyCanFail"
                value={formData.whyCanFail}
                onChange={handleChange}
                rows={4}
                placeholder="BEAR CASE: RISKS, CONCERNS..."
                className="brutal-input resize-none border-red-700"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn brutal-btn-secondary flex-1"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn flex-1"
            >
              {loading ? 'ADDING...' : 'ADD TRADE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddActiveTradeForm
