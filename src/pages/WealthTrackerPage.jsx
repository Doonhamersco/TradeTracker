import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToWealthSnapshots, getLatestSnapshot } from '../services/wealthSnapshotsService'
import { subscribeToActiveTrades } from '../services/activeTradesService'
import { subscribeToManualHoldings } from '../services/manualHoldingsService'
import { fetchMultiplePrices } from '../services/priceService'
import AppLayout from '../components/Layout/AppLayout'
import SubNav from '../components/Navigation/SubNav'
import AddSnapshotForm from '../components/WealthTracker/AddSnapshotForm'

function WealthTrackerPage() {
  const { currentUser } = useAuth()
  const [snapshots, setSnapshots] = useState([])
  const [latestSnapshot, setLatestSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // For auto-calculating crypto value
  const [activeTrades, setActiveTrades] = useState([])
  const [manualHoldings, setManualHoldings] = useState([])
  const [livePrices, setLivePrices] = useState({})

  // Subscribe to wealth snapshots
  useEffect(() => {
    if (!currentUser?.uid) {
      setSnapshots([])
      setLatestSnapshot(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToWealthSnapshots(currentUser.uid, (result) => {
      if (result.success) {
        setSnapshots(result.snapshots)
        setLatestSnapshot(result.snapshots[0] || null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to active trades for crypto calculation
  useEffect(() => {
    if (!currentUser?.uid) return

    const unsubscribe = subscribeToActiveTrades(currentUser.uid, (result) => {
      if (result.success) {
        setActiveTrades(result.trades)
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to manual holdings for crypto calculation
  useEffect(() => {
    if (!currentUser?.uid) return

    const unsubscribe = subscribeToManualHoldings(currentUser.uid, (result) => {
      if (result.success) {
        setManualHoldings(result.holdings)
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch live prices for crypto calculation
  const fetchPrices = useCallback(async () => {
    const activeTradesTickers = activeTrades.map(t => t.assetName.toUpperCase())
    const manualHoldingsTickers = manualHoldings.map(h => h.assetName.toUpperCase())
    const tickers = [...new Set([...activeTradesTickers, ...manualHoldingsTickers])]
    
    if (tickers.length === 0) return
    
    const result = await fetchMultiplePrices(tickers)
    if (result.success) {
      setLivePrices(result.prices)
    }
  }, [activeTrades, manualHoldings])

  useEffect(() => {
    if (activeTrades.length > 0 || manualHoldings.length > 0) {
      fetchPrices()
    }
  }, [activeTrades.length, manualHoldings.length, fetchPrices])

  // Calculate total crypto value in USD
  const calculateCryptoValueUSD = useCallback(() => {
    let total = 0
    
    // From active trades
    activeTrades.forEach(trade => {
      const currentPrice = livePrices[trade.assetName.toUpperCase()] || trade.currentPrice || 0
      const quantity = trade.positionSize / trade.entryPrice
      total += quantity * currentPrice
    })
    
    // From manual holdings
    manualHoldings.forEach(holding => {
      const currentPrice = livePrices[holding.assetName.toUpperCase()] || holding.avgEntryPrice || 0
      total += holding.quantity * currentPrice
    })
    
    return total
  }, [activeTrades, manualHoldings, livePrices])

  const formatCurrency = (value, currency = 'GBP') => {
    const symbol = currency === 'GBP' ? '£' : '$'
    return `${symbol}${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('en-GB', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString))
  }

  const portfolioSubNavTabs = [
    { id: 'overview', label: 'OVERVIEW', path: '' },
    { id: 'wealth', label: 'WEALTH TRACKER', path: '/wealth' },
  ]

  return (
    <AppLayout>
      {/* Portfolio Sub Navigation */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SubNav tabs={portfolioSubNavTabs} basePath="/portfolio" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Section Header */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <h1 className="brutal-title text-3xl md:text-4xl">WEALTH TRACKER</h1>
          <button 
            onClick={() => setShowAddForm(true)}
            className="brutal-btn"
          >
            + ADD SNAPSHOT
          </button>
        </div>

        {loading ? (
          <div className="brutal-section p-16 text-center">
            <p className="brutal-title text-xl">LOADING...</p>
          </div>
        ) : snapshots.length === 0 ? (
          /* Empty State */
          <div className="brutal-section p-16 text-center">
            <div className="text-6xl mb-6">📊</div>
            <p className="brutal-title text-2xl mb-4">NO WEALTH SNAPSHOTS YET</p>
            <p className="text-gray-600 uppercase text-sm tracking-wider mb-8 max-w-md mx-auto">
              Start tracking your net worth journey. Add your first snapshot to visualize your wealth growth over time.
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="brutal-btn"
            >
              ADD FIRST SNAPSHOT
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Net Worth Card */}
            <div className="brutal-section">
              <div className="border-b-6 border-black p-6">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div>
                    <p className="brutal-label mb-2">CURRENT NET WORTH</p>
                    <p className="text-4xl md:text-5xl font-bold font-mono">
                      {formatCurrency(latestSnapshot?.calculated?.netWorthGBP || 0)}
                    </p>
                    {latestSnapshot?.calculated?.changeGBP !== null && (
                      <p className={`text-xl font-mono mt-2 ${
                        latestSnapshot.calculated.changeGBP >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {latestSnapshot.calculated.changeGBP >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(latestSnapshot.calculated.changeGBP))} ({formatPercent(latestSnapshot.calculated.changePercent)}) since last snapshot
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="brutal-label">LAST UPDATED</p>
                    <p className="font-mono">{formatDate(latestSnapshot?.date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Snapshot Breakdown */}
            {latestSnapshot && (
              <div className="brutal-section">
                <div className="border-b-6 border-black p-4">
                  <h2 className="brutal-title text-xl">SNAPSHOT BREAKDOWN</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-y-2 md:divide-y-0 divide-black">
                  {/* Bank */}
                  <div className="p-6">
                    <p className="brutal-label mb-2">BANK</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(latestSnapshot.assets?.bankGBP || 0)}
                    </p>
                  </div>
                  {/* Hargreaves */}
                  <div className="p-6">
                    <p className="brutal-label mb-2">HARGREAVES</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(latestSnapshot.assets?.hargreavesGBP || 0)}
                    </p>
                  </div>
                  {/* Crypto */}
                  <div className="p-6">
                    <p className="brutal-label mb-2">CRYPTO</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(latestSnapshot.calculated?.cryptoGBP || 0)}
                    </p>
                    <p className="text-sm text-gray-500 font-mono">
                      ({formatCurrency(latestSnapshot.assets?.cryptoUSD || 0, 'USD')})
                    </p>
                  </div>
                  {/* Student Loan */}
                  <div className="p-6 bg-red-50">
                    <p className="brutal-label mb-2 text-loss">STUDENT LOAN</p>
                    <p className="text-2xl font-bold font-mono text-loss">
                      -{formatCurrency(latestSnapshot.debts?.studentLoanGBP || 0)}
                    </p>
                  </div>
                </div>
                {/* Totals Row */}
                <div className="border-t-6 border-black grid grid-cols-3 divide-x-2 divide-black">
                  <div className="p-6">
                    <p className="brutal-label mb-2">TOTAL ASSETS</p>
                    <p className="text-xl font-bold font-mono text-profit">
                      {formatCurrency(latestSnapshot.calculated?.totalAssetsGBP || 0)}
                    </p>
                  </div>
                  <div className="p-6">
                    <p className="brutal-label mb-2">TOTAL DEBTS</p>
                    <p className="text-xl font-bold font-mono text-loss">
                      {formatCurrency(latestSnapshot.calculated?.totalDebtsGBP || 0)}
                    </p>
                  </div>
                  <div className="p-6 bg-gray-100">
                    <p className="brutal-label mb-2">NET WORTH</p>
                    <p className="text-xl font-bold font-mono">
                      {formatCurrency(latestSnapshot.calculated?.netWorthGBP || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Placeholder */}
            {snapshots.length >= 2 ? (
              <div className="brutal-section">
                <div className="border-b-6 border-black p-4 flex justify-between items-center">
                  <h2 className="brutal-title text-xl">NET WORTH HISTORY</h2>
                  <div className="flex gap-1">
                    {['1M', '3M', '6M', '1Y', '5Y', 'ALL'].map((range, i) => (
                      <button 
                        key={range}
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          i === 5 ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-8">
                  <div className="h-64 flex items-center justify-center bg-gray-50 border-2 border-dashed border-black">
                    <div className="text-center">
                      <p className="brutal-title text-xl mb-2">📈 CHART</p>
                      <p className="text-gray-500 uppercase text-sm">Coming in Phase 7</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="brutal-section p-8 text-center">
                <p className="text-gray-600 uppercase text-sm">
                  Add at least 2 snapshots to see your net worth trend
                </p>
              </div>
            )}

            {/* History Table */}
            <div className="brutal-section">
              <div className="border-b-6 border-black p-4 flex justify-between items-center">
                <h2 className="brutal-title text-xl">HISTORY ({snapshots.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="brutal-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>NET WORTH</th>
                      <th>CHANGE</th>
                      <th>CHANGE %</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice(0, 10).map((snapshot) => (
                      <tr key={snapshot.id}>
                        <td className="font-mono">{formatDate(snapshot.date)}</td>
                        <td className="font-bold font-mono">
                          {formatCurrency(snapshot.calculated?.netWorthGBP || 0)}
                        </td>
                        <td className={`font-mono ${
                          snapshot.calculated?.changeGBP >= 0 ? 'text-profit' : 
                          snapshot.calculated?.changeGBP < 0 ? 'text-loss' : ''
                        }`}>
                          {snapshot.calculated?.changeGBP !== null 
                            ? `${snapshot.calculated.changeGBP >= 0 ? '+' : ''}${formatCurrency(snapshot.calculated.changeGBP)}`
                            : '—'
                          }
                        </td>
                        <td className={`font-mono ${
                          snapshot.calculated?.changePercent >= 0 ? 'text-profit' : 
                          snapshot.calculated?.changePercent < 0 ? 'text-loss' : ''
                        }`}>
                          {formatPercent(snapshot.calculated?.changePercent)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="text-xs px-3 py-1 border-2 border-black hover:bg-black hover:text-white">
                              EDIT
                            </button>
                            <button className="text-xs px-3 py-1 border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {snapshots.length > 10 && (
                <div className="border-t-2 border-black p-4 text-center">
                  <button className="brutal-btn brutal-btn-secondary">
                    VIEW ALL {snapshots.length} SNAPSHOTS
                  </button>
                </div>
              )}
            </div>

            {/* Tax Status */}
            {latestSnapshot?.tax && (
              <div className="brutal-section">
                <div className="border-b-6 border-black p-4">
                  <h2 className="brutal-title text-xl">TAX STATUS</h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-8 items-center">
                    <div>
                      <p className="brutal-label mb-1">STATUS</p>
                      <span className={`inline-block px-4 py-2 font-bold uppercase ${
                        latestSnapshot.tax.status === 'Up to date' 
                          ? 'bg-green-100 text-green-800'
                          : latestSnapshot.tax.status === 'Overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {latestSnapshot.tax.status || 'Not set'}
                      </span>
                    </div>
                    {latestSnapshot.tax.lastFiled && (
                      <div>
                        <p className="brutal-label mb-1">LAST FILED</p>
                        <p className="font-mono">{latestSnapshot.tax.lastFiled}</p>
                      </div>
                    )}
                    {latestSnapshot.tax.nextDeadline && (
                      <div>
                        <p className="brutal-label mb-1">NEXT DEADLINE</p>
                        <p className="font-mono">{latestSnapshot.tax.nextDeadline}</p>
                      </div>
                    )}
                  </div>
                  {latestSnapshot.tax.notes && (
                    <div className="mt-4 pt-4 border-t-2 border-black">
                      <p className="brutal-label mb-1">NOTES</p>
                      <p className="text-gray-700">{latestSnapshot.tax.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Snapshot Modal */}
      {showAddForm && (
        <AddSnapshotForm 
          onClose={() => setShowAddForm(false)} 
          userId={currentUser?.uid}
          cryptoValueUSD={calculateCryptoValueUSD()}
          previousSnapshot={latestSnapshot}
        />
      )}
    </AppLayout>
  )
}

export default WealthTrackerPage

