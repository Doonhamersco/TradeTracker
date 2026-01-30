import { useState } from 'react'
import { addManualHolding } from '../../services/manualHoldingsService'

function AddHoldingForm({ onClose, userId }) {
  const [formData, setFormData] = useState({
    assetName: '',
    quantity: '',
    avgEntryPrice: '',
    category: 'Conviction',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.assetName.trim()) {
      setError('Asset name is required')
      return
    }
    
    const quantity = parseFloat(formData.quantity)
    const avgEntryPrice = parseFloat(formData.avgEntryPrice)

    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (isNaN(avgEntryPrice) || avgEntryPrice <= 0) {
      setError('Please enter a valid average entry price')
      return
    }

    setLoading(true)

    const holdingData = {
      assetName: formData.assetName.trim().toUpperCase(),
      quantity,
      avgEntryPrice,
      costBasis: quantity * avgEntryPrice,
      category: formData.category,
      notes: formData.notes.trim(),
      source: 'manual'
    }

    const result = await addManualHolding(holdingData, userId)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Failed to add holding')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-6 border-black w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-6 border-black px-6 py-4 flex justify-between items-center">
          <h2 className="brutal-title text-xl">ADD MANUAL HOLDING</h2>
          <button 
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-50 transition-opacity"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-700 p-3">
              <p className="text-red-700 font-bold text-sm uppercase">{error}</p>
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label className="brutal-label">ASSET / TICKER *</label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleChange}
              placeholder="BTC, ETH, SOL..."
              className="brutal-input"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="brutal-label">QUANTITY *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0.00"
              step="any"
              min="0"
              className="brutal-input"
              required
            />
            <p className="text-xs text-gray-500 mt-1 uppercase">
              How many tokens/coins do you hold?
            </p>
          </div>

          {/* Average Entry Price */}
          <div>
            <label className="brutal-label">AVG ENTRY PRICE (USD) *</label>
            <input
              type="number"
              name="avgEntryPrice"
              value={formData.avgEntryPrice}
              onChange={handleChange}
              placeholder="0.00"
              step="any"
              min="0"
              className="brutal-input"
              required
            />
            <p className="text-xs text-gray-500 mt-1 uppercase">
              Average price you paid per token
            </p>
          </div>

          {/* Calculated Cost Basis */}
          {formData.quantity && formData.avgEntryPrice && (
            <div className="bg-gray-100 border-2 border-black p-4">
              <p className="brutal-label">COST BASIS</p>
              <p className="text-2xl font-bold font-mono">
                ${(parseFloat(formData.quantity) * parseFloat(formData.avgEntryPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="brutal-label">CATEGORY</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="brutal-input"
            >
              <option value="Conviction">CONVICTION</option>
              <option value="Fibonacci">FIBONACCI</option>
              <option value="Degen">DEGEN</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="brutal-label">NOTES (OPTIONAL)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Where is this held? (e.g., Ledger, Coinbase, etc.)"
              className="brutal-input min-h-20 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn flex-1"
            >
              {loading ? 'ADDING...' : 'ADD HOLDING'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn brutal-btn-secondary"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddHoldingForm

