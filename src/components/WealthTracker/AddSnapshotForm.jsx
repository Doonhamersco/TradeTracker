import { useState, useEffect } from 'react'
import { addWealthSnapshot, checkSnapshotExists, calculateSnapshotValues } from '../../services/wealthSnapshotsService'
import { fetchGBPUSDRate, validateExchangeRate } from '../../services/exchangeRateService'

function AddSnapshotForm({ onClose, userId, cryptoValueUSD, previousSnapshot }) {
  const getCurrentDateString = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    date: getCurrentDateString(),
    bankGBP: '',
    hargreavesGBP: '',
    cryptoUSD: cryptoValueUSD?.toFixed(2) || '',
    cryptoManualOverride: false,
    studentLoanGBP: '',
    exchangeRate: '',
    exchangeRateSource: 'auto',
    taxStatus: 'Up to date',
    taxLastFiled: previousSnapshot?.tax?.lastFiled || '',
    taxNextDeadline: previousSnapshot?.tax?.nextDeadline || '',
    taxNotes: '',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  // Fetch exchange rate on mount
  useEffect(() => {
    fetchExchangeRate()
  }, [])

  // Check for duplicate snapshot when date changes
  useEffect(() => {
    const checkDuplicate = async () => {
      if (userId && formData.date) {
        const result = await checkSnapshotExists(userId, formData.date)
        if (result.exists) {
          setDuplicateWarning(`A snapshot already exists for ${formData.date}. Saving will update it.`)
        } else {
          setDuplicateWarning(null)
        }
      }
    }
    checkDuplicate()
  }, [userId, formData.date])

  // Update crypto value when prop changes (unless manually overridden)
  useEffect(() => {
    if (!formData.cryptoManualOverride && cryptoValueUSD) {
      setFormData(prev => ({ ...prev, cryptoUSD: cryptoValueUSD.toFixed(2) }))
    }
  }, [cryptoValueUSD, formData.cryptoManualOverride])

  const fetchExchangeRate = async () => {
    setFetchingRate(true)
    const result = await fetchGBPUSDRate()
    
    if (result.success) {
      setFormData(prev => ({ 
        ...prev, 
        exchangeRate: result.rate.toFixed(4),
        exchangeRateSource: 'auto'
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        exchangeRate: result.rate?.toFixed(4) || '1.2500',
        exchangeRateSource: 'fallback'
      }))
    }
    setFetchingRate(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'cryptoUSD' && !formData.cryptoManualOverride) {
      // If user manually edits crypto, enable override
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        cryptoManualOverride: true 
      }))
    } else if (name === 'exchangeRate') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        exchangeRateSource: 'manual'
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }))
    }
    setError('')
  }

  const resetCryptoToAuto = () => {
    setFormData(prev => ({ 
      ...prev, 
      cryptoUSD: cryptoValueUSD?.toFixed(2) || '',
      cryptoManualOverride: false 
    }))
  }

  // Calculate preview values
  const getPreviewValues = () => {
    const assets = {
      bankGBP: parseFloat(formData.bankGBP) || 0,
      hargreavesGBP: parseFloat(formData.hargreavesGBP) || 0,
      cryptoUSD: parseFloat(formData.cryptoUSD) || 0
    }
    
    const debts = {
      studentLoanGBP: parseFloat(formData.studentLoanGBP) || 0
    }
    
    const exchangeRate = {
      GBPUSD: parseFloat(formData.exchangeRate) || 1.25
    }
    
    return calculateSnapshotValues({ assets, debts, exchangeRate }, previousSnapshot)
  }

  const preview = getPreviewValues()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    const bankGBP = parseFloat(formData.bankGBP)
    const hargreavesGBP = parseFloat(formData.hargreavesGBP)
    const cryptoUSD = parseFloat(formData.cryptoUSD)
    const studentLoanGBP = parseFloat(formData.studentLoanGBP)
    const exchangeRate = parseFloat(formData.exchangeRate)

    if (isNaN(bankGBP) || bankGBP < 0) {
      setError('Please enter a valid bank balance')
      return
    }

    if (isNaN(hargreavesGBP) || hargreavesGBP < 0) {
      setError('Please enter a valid Hargreaves balance')
      return
    }

    if (isNaN(cryptoUSD) || cryptoUSD < 0) {
      setError('Please enter a valid crypto value')
      return
    }

    if (isNaN(studentLoanGBP) || studentLoanGBP < 0) {
      setError('Please enter a valid student loan balance')
      return
    }

    const rateValidation = validateExchangeRate(exchangeRate)
    if (!rateValidation.valid) {
      setError(rateValidation.error)
      return
    }

    setLoading(true)

    const snapshotData = {
      date: formData.date,
      timestamp: new Date(formData.date).getTime(),
      assets: {
        bankGBP,
        hargreavesGBP,
        cryptoUSD
      },
      debts: {
        studentLoanGBP
      },
      exchangeRate: {
        GBPUSD: exchangeRate,
        source: formData.exchangeRateSource,
        fetchedAt: Date.now()
      },
      tax: {
        status: formData.taxStatus,
        lastFiled: formData.taxLastFiled,
        nextDeadline: formData.taxNextDeadline,
        notes: formData.taxNotes
      },
      notes: formData.notes
    }

    const result = await addWealthSnapshot(snapshotData, userId)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Failed to save snapshot')
    }

    setLoading(false)
  }

  const formatCurrency = (value, currency = 'GBP') => {
    const symbol = currency === 'GBP' ? '£' : '$'
    return `${symbol}${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-6 border-black w-full max-w-2xl max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-6 border-black px-6 py-4 flex justify-between items-center z-10">
          <h2 className="brutal-title text-xl">ADD WEALTH SNAPSHOT</h2>
          <button 
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-50 transition-opacity"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-700 p-3">
              <p className="text-red-700 font-bold text-sm uppercase">{error}</p>
            </div>
          )}

          {duplicateWarning && (
            <div className="bg-yellow-50 border-2 border-yellow-700 p-3">
              <p className="text-yellow-700 font-bold text-sm uppercase">{duplicateWarning}</p>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="brutal-label">DATE *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={getCurrentDateString()}
              className="brutal-input"
              required
            />
          </div>

          {/* Assets Section */}
          <div className="border-t-4 border-black pt-4">
            <h3 className="brutal-title text-lg mb-4">ASSETS</h3>
            
            <div className="space-y-4">
              <div>
                <label className="brutal-label">BANK ACCOUNT (GBP) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold pointer-events-none">£</span>
                  <input
                    type="number"
                    name="bankGBP"
                    value={formData.bankGBP}
                    onChange={handleChange}
                    placeholder="5007.00"
                    step="0.01"
                    min="0"
                    className="brutal-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="brutal-label">HARGREAVES LANSDOWN (GBP) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold pointer-events-none">£</span>
                  <input
                    type="number"
                    name="hargreavesGBP"
                    value={formData.hargreavesGBP}
                    onChange={handleChange}
                    placeholder="2724.00"
                    step="0.01"
                    min="0"
                    className="brutal-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="brutal-label">CRYPTO HOLDINGS (USD) *</label>
                  <span className={`text-xs px-2 py-0.5 font-bold ${
                    formData.cryptoManualOverride 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {formData.cryptoManualOverride ? 'MANUAL' : 'AUTO-CALCULATED'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold pointer-events-none">$</span>
                  <input
                    type="number"
                    name="cryptoUSD"
                    value={formData.cryptoUSD}
                    onChange={handleChange}
                    placeholder="36613.00"
                    step="0.01"
                    min="0"
                    className="brutal-input pl-10"
                    required
                  />
                </div>
                {formData.cryptoManualOverride && (
                  <button
                    type="button"
                    onClick={resetCryptoToAuto}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    ↺ Reset to auto-calculated value ({formatCurrency(cryptoValueUSD || 0, 'USD')})
                  </button>
                )}
                {!formData.cryptoManualOverride && (
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated from Active Trades + Manual Holdings
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Debts Section */}
          <div className="border-t-4 border-black pt-4">
            <h3 className="brutal-title text-lg mb-4">DEBTS</h3>
            
            <div>
              <label className="brutal-label">STUDENT LOAN (GBP) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold pointer-events-none">£</span>
                <input
                  type="number"
                  name="studentLoanGBP"
                  value={formData.studentLoanGBP}
                  onChange={handleChange}
                  placeholder="10567.58"
                  step="0.01"
                  min="0"
                  className="brutal-input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Exchange Rate Section */}
          <div className="border-t-4 border-black pt-4">
            <h3 className="brutal-title text-lg mb-4">EXCHANGE RATE</h3>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="brutal-label">GBP/USD RATE *</label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 font-bold ${
                    formData.exchangeRateSource === 'auto' 
                      ? 'bg-green-100 text-green-800' 
                      : formData.exchangeRateSource === 'manual'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.exchangeRateSource.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={fetchingRate}
                    className="text-xs px-2 py-1 border border-black hover:bg-black hover:text-white"
                  >
                    {fetchingRate ? '...' : '↻'}
                  </button>
                </div>
              </div>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                placeholder="1.2500"
                step="0.0001"
                min="0.1"
                max="5"
                className="brutal-input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                £1 = ${formData.exchangeRate || '?.??'}
              </p>
            </div>
          </div>

          {/* Tax Section */}
          <div className="border-t-4 border-black pt-4">
            <h3 className="brutal-title text-lg mb-4">TAX STATUS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="brutal-label">STATUS</label>
                <select
                  name="taxStatus"
                  value={formData.taxStatus}
                  onChange={handleChange}
                  className="brutal-input"
                >
                  <option value="Up to date">UP TO DATE</option>
                  <option value="Pending">PENDING</option>
                  <option value="Overdue">OVERDUE</option>
                  <option value="Not applicable">NOT APPLICABLE</option>
                </select>
              </div>
              <div>
                <label className="brutal-label">LAST FILED</label>
                <input
                  type="text"
                  name="taxLastFiled"
                  value={formData.taxLastFiled}
                  onChange={handleChange}
                  placeholder="Nov 2024"
                  className="brutal-input"
                />
              </div>
              <div>
                <label className="brutal-label">NEXT DEADLINE</label>
                <input
                  type="text"
                  name="taxNextDeadline"
                  value={formData.taxNextDeadline}
                  onChange={handleChange}
                  placeholder="Jan 2027"
                  className="brutal-input"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="brutal-label">TAX NOTES</label>
              <textarea
                name="taxNotes"
                value={formData.taxNotes}
                onChange={handleChange}
                placeholder="Any tax-related notes..."
                className="brutal-input min-h-16 resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className="border-t-4 border-black pt-4">
            <label className="brutal-label">NOTES (OPTIONAL)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Weekly reflections, market context, life events..."
              className="brutal-input min-h-20 resize-none"
              rows={3}
            />
          </div>

          {/* Calculated Summary */}
          <div className="border-t-6 border-black pt-4 bg-gray-50 -mx-6 px-6 pb-6">
            <h3 className="brutal-title text-lg mb-4">CALCULATED SUMMARY</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="brutal-label">TOTAL ASSETS</p>
                <p className="text-xl font-bold font-mono text-profit">
                  {formatCurrency(preview.totalAssetsGBP)}
                </p>
              </div>
              <div>
                <p className="brutal-label">TOTAL DEBTS</p>
                <p className="text-xl font-bold font-mono text-loss">
                  {formatCurrency(preview.totalDebtsGBP)}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-black pt-4">
              <p className="brutal-label">NET WORTH</p>
              <p className={`text-3xl font-bold font-mono ${preview.netWorthGBP >= 0 ? '' : 'text-loss'}`}>
                {formatCurrency(preview.netWorthGBP)}
              </p>
              {preview.changeGBP !== null && (
                <p className={`text-lg font-mono mt-1 ${preview.changeGBP >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {preview.changeGBP >= 0 ? '+' : ''}{formatCurrency(preview.changeGBP)} ({formatPercent(preview.changePercent)}) vs previous
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn flex-1"
            >
              {loading ? 'SAVING...' : 'SAVE SNAPSHOT'}
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

export default AddSnapshotForm

