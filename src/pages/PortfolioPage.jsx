import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToActiveTrades } from '../services/activeTradesService'
import { subscribeToManualHoldings, deleteManualHolding } from '../services/manualHoldingsService'
import { fetchMultiplePrices } from '../services/priceService'
import AppLayout from '../components/Layout/AppLayout'
import SubNav from '../components/Navigation/SubNav'
import AssetPieChart from '../components/Portfolio/AssetPieChart'
import AddHoldingForm from '../components/Portfolio/AddHoldingForm'

function PortfolioPage() {
  const { currentUser } = useAuth()
  const [activeTrades, setActiveTrades] = useState([])
  const [manualHoldings, setManualHoldings] = useState([])
  const [livePrices, setLivePrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [chartView, setChartView] = useState('coin') // 'coin' or 'category'
  const [showAddHoldingForm, setShowAddHoldingForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Subscribe to active trades
  useEffect(() => {
    if (!currentUser?.uid) {
      setActiveTrades([])
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToActiveTrades(currentUser.uid, (result) => {
      if (result.success) {
        setActiveTrades(result.trades)
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to manual holdings
  useEffect(() => {
    if (!currentUser?.uid) {
      setManualHoldings([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToManualHoldings(currentUser.uid, (result) => {
      if (result.success) {
        setManualHoldings(result.holdings)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Get all unique tickers for price fetching
  const getAllTickers = useCallback(() => {
    const activeTradesTickers = activeTrades.map(t => t.assetName.toUpperCase())
    const manualHoldingsTickers = manualHoldings.map(h => h.assetName.toUpperCase())
    return [...new Set([...activeTradesTickers, ...manualHoldingsTickers])]
  }, [activeTrades, manualHoldings])

  // Fetch live prices
  const fetchPrices = useCallback(async () => {
    const tickers = getAllTickers()
    if (tickers.length === 0) return
    
    setPricesLoading(true)
    const result = await fetchMultiplePrices(tickers)
    
    if (result.success) {
      setLivePrices(result.prices)
    }
    setPricesLoading(false)
  }, [getAllTickers])

  useEffect(() => {
    const tickers = getAllTickers()
    if (tickers.length > 0) {
      fetchPrices()
    }
  }, [activeTrades.length, manualHoldings.length, fetchPrices, getAllTickers])

  // Calculate portfolio data combining active trades and manual holdings
  const calculatePortfolio = () => {
    const hasActiveTrades = activeTrades.length > 0
    const hasManualHoldings = manualHoldings.length > 0
    
    if (!hasActiveTrades && !hasManualHoldings) {
      return { items: [], metrics: null }
    }

    // Start with a grouped object
    const grouped = {}

    // Add active trades
    activeTrades.forEach(trade => {
      const coin = trade.assetName.toUpperCase()
      if (!grouped[coin]) {
        grouped[coin] = {
          coin,
          activeTrades: [],
          manualHoldings: [],
          totalCostBasis: 0,
          category: trade.category,
          source: 'active'
        }
      }
      grouped[coin].activeTrades.push(trade)
      grouped[coin].totalCostBasis += trade.positionSize || 0
    })

    // Add manual holdings
    manualHoldings.forEach(holding => {
      const coin = holding.assetName.toUpperCase()
      if (!grouped[coin]) {
        grouped[coin] = {
          coin,
          activeTrades: [],
          manualHoldings: [],
          totalCostBasis: 0,
          category: holding.category,
          source: 'manual'
        }
      } else {
        grouped[coin].source = 'hybrid'
      }
      grouped[coin].manualHoldings.push(holding)
      grouped[coin].totalCostBasis += holding.costBasis || 0
    })

    // Calculate values with live prices
    const items = Object.values(grouped).map(group => {
      // Calculate total quantity from active trades
      const activeQuantity = group.activeTrades.reduce((sum, t) => {
        return sum + (t.positionSize / t.entryPrice)
      }, 0)

      // Calculate total quantity from manual holdings
      const manualQuantity = group.manualHoldings.reduce((sum, h) => {
        return sum + (h.quantity || 0)
      }, 0)

      const totalQuantity = activeQuantity + manualQuantity

      // Get current price
      const currentPrice = livePrices[group.coin] || 
        group.activeTrades[0]?.currentPrice || 
        group.manualHoldings[0]?.avgEntryPrice || 
        0

      // Calculate avg entry price
      let avgEntryPrice = 0
      if (group.totalCostBasis > 0 && totalQuantity > 0) {
        avgEntryPrice = group.totalCostBasis / totalQuantity
      }

      const value = totalQuantity * currentPrice
      const costBasis = group.totalCostBasis
      const unrealizedPnL = value - costBasis
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

      return {
        coin: group.coin,
        value,
        costBasis,
        quantity: totalQuantity,
        currentPrice,
        avgEntryPrice,
        unrealizedPnL,
        unrealizedPnLPercent,
        category: group.category,
        tradesCount: group.activeTrades.length,
        holdingsCount: group.manualHoldings.length,
        source: group.source,
        holdingIds: group.manualHoldings.map(h => h.id)
      }
    }).sort((a, b) => b.value - a.value)

    const totalValue = items.reduce((sum, i) => sum + i.value, 0)
    const totalCostBasis = items.reduce((sum, i) => sum + i.costBasis, 0)
    const totalUnrealizedPnL = totalValue - totalCostBasis
    const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0

    // Add percentage to each item
    items.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0
    })

    const metrics = {
      totalValue,
      totalPositions: items.length,
      unrealizedPnL: totalUnrealizedPnL,
      unrealizedPnLPercent: totalUnrealizedPnLPercent,
      largestPosition: items[0] || null,
      smallestPosition: items[items.length - 1] || null,
      bestPerformer: [...items].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)[0] || null,
      worstPerformer: [...items].sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)[0] || null
    }

    return { items, metrics }
  }

  const { items: portfolioItems, metrics } = calculatePortfolio()

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleDeleteHolding = async (holdingId) => {
    const result = await deleteManualHolding(holdingId)
    if (result.success) {
      setDeleteConfirmId(null)
    } else {
      alert('Error deleting holding: ' + result.error)
    }
  }

  const getSourceLabel = (source) => {
    switch (source) {
      case 'active': return 'ACTIVE TRADE'
      case 'manual': return 'MANUAL'
      case 'hybrid': return 'ACTIVE + MANUAL'
      default: return ''
    }
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
          <h1 className="brutal-title text-3xl md:text-4xl">PORTFOLIO OVERVIEW</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddHoldingForm(true)}
              className="brutal-btn text-sm py-2"
            >
              + ADD HOLDING
            </button>
            <button 
              onClick={fetchPrices}
              disabled={pricesLoading}
              className="brutal-btn brutal-btn-secondary text-sm py-2"
            >
              {pricesLoading ? 'UPDATING...' : '↻ REFRESH'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="brutal-section p-16 text-center">
            <p className="brutal-title text-xl">LOADING...</p>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="brutal-section p-16 text-center">
            <div className="text-6xl mb-6">📊</div>
            <p className="brutal-title text-2xl mb-4">NO PORTFOLIO DATA</p>
            <p className="text-gray-600 uppercase text-sm tracking-wider mb-8">
              Add active trades or manual holdings to see your asset allocation.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/trades/active" className="brutal-btn">
                GO TO ACTIVE TRADES
              </a>
              <button 
                onClick={() => setShowAddHoldingForm(true)}
                className="brutal-btn brutal-btn-secondary"
              >
                + ADD HOLDING
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Pie Chart & Asset List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pie Chart */}
              <div className="brutal-section">
                {/* View Toggle Header */}
                <div className="border-b-6 border-black flex">
                  <button 
                    onClick={() => setChartView('coin')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                      chartView === 'coin' 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    BY COIN
                  </button>
                  <button 
                    onClick={() => setChartView('category')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black ${
                      chartView === 'category' 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    BY CATEGORY
                  </button>
                </div>
                
                {/* Chart */}
                <div className="p-6">
                  <AssetPieChart 
                    data={portfolioItems}
                    view={chartView}
                    totalValue={metrics.totalValue}
                  />
                </div>
              </div>

              {/* Asset List */}
              <div className="brutal-section">
                <div className="border-b-6 border-black p-4 flex justify-between items-center">
                  <h2 className="brutal-title text-xl">HOLDINGS ({portfolioItems.length})</h2>
                  <span className="text-xs font-mono text-gray-500">
                    {pricesLoading ? 'UPDATING...' : 'LIVE PRICES'}
                  </span>
                </div>
                <div className="divide-y-2 divide-black">
                  {portfolioItems.map((item, index) => (
                    <div key={item.coin} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 bg-black text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-lg truncate">{item.coin}</p>
                            <div className="flex gap-2 items-center">
                              <span className={`text-xs px-2 py-0.5 font-bold uppercase ${
                                item.source === 'manual' ? 'bg-yellow-100 text-yellow-800' :
                                item.source === 'hybrid' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getSourceLabel(item.source)}
                              </span>
                              <span className="text-xs text-gray-500 uppercase font-mono">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono">{formatCurrency(item.value)}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {item.quantity.toFixed(4)} @ ${item.currentPrice?.toFixed(4) || '0.00'}
                          </p>
                        </div>
                        <div className="text-right min-w-16">
                          <p className={`font-bold font-mono ${item.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {formatPercent(item.unrealizedPnLPercent)}
                          </p>
                          <p className={`text-xs font-mono ${item.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {formatCurrency(item.unrealizedPnL)}
                          </p>
                        </div>
                        <div className="text-right min-w-12">
                          <p className="font-bold font-mono">{item.percentage.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500 uppercase">ALLOC</p>
                        </div>
                        {/* Delete button for manual holdings */}
                        {item.source === 'manual' && item.holdingIds.length > 0 && (
                          <div>
                            {deleteConfirmId === item.holdingIds[0] ? (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-xs px-2 py-1 border border-black hover:bg-gray-100"
                                >
                                  ✕
                                </button>
                                <button 
                                  onClick={() => handleDeleteHolding(item.holdingIds[0])}
                                  className="text-xs px-2 py-1 bg-red-700 text-white hover:bg-red-800"
                                >
                                  DELETE
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeleteConfirmId(item.holdingIds[0])}
                                className="text-xs px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Metrics */}
            <div className="space-y-4">
              {/* Total Value */}
              <div className="brutal-section p-6">
                <p className="brutal-label mb-2">TOTAL VALUE</p>
                <p className="text-3xl font-bold font-mono">{formatCurrency(metrics.totalValue)}</p>
              </div>

              {/* Positions */}
              <div className="brutal-section p-6">
                <p className="brutal-label mb-2">POSITIONS</p>
                <p className="text-3xl font-bold font-mono">{metrics.totalPositions}</p>
              </div>

              {/* Unrealized P&L */}
              <div className={`brutal-section p-6 ${metrics.unrealizedPnL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="brutal-label mb-2">UNREALIZED P&L</p>
                <p className={`text-2xl font-bold font-mono ${metrics.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(metrics.unrealizedPnL)}
                </p>
                <p className={`text-lg font-mono ${metrics.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatPercent(metrics.unrealizedPnLPercent)}
                </p>
              </div>

              {/* Largest Position */}
              {metrics.largestPosition && (
                <div className="brutal-section p-6">
                  <p className="brutal-label mb-2">LARGEST POSITION</p>
                  <p className="text-xl font-bold">{metrics.largestPosition.coin}</p>
                  <p className="font-mono">{formatCurrency(metrics.largestPosition.value)}</p>
                  <p className="font-mono text-sm text-gray-600">{metrics.largestPosition.percentage.toFixed(1)}% OF PORTFOLIO</p>
                </div>
              )}

              {/* Smallest Position */}
              {metrics.smallestPosition && metrics.totalPositions > 1 && (
                <div className="brutal-section p-6">
                  <p className="brutal-label mb-2">SMALLEST POSITION</p>
                  <p className="text-xl font-bold">{metrics.smallestPosition.coin}</p>
                  <p className="font-mono">{formatCurrency(metrics.smallestPosition.value)}</p>
                  <p className="font-mono text-sm text-gray-600">{metrics.smallestPosition.percentage.toFixed(1)}% OF PORTFOLIO</p>
                </div>
              )}

              {/* Best Performer */}
              {metrics.bestPerformer && (
                <div className="brutal-section p-6 border-l-4 border-green-700">
                  <p className="brutal-label mb-2 text-profit">BEST PERFORMER</p>
                  <p className="text-xl font-bold">{metrics.bestPerformer.coin}</p>
                  <p className="font-mono text-profit">{formatPercent(metrics.bestPerformer.unrealizedPnLPercent)}</p>
                </div>
              )}

              {/* Worst Performer */}
              {metrics.worstPerformer && (
                <div className="brutal-section p-6 border-l-4 border-red-700">
                  <p className="brutal-label mb-2 text-loss">WORST PERFORMER</p>
                  <p className="text-xl font-bold">{metrics.worstPerformer.coin}</p>
                  <p className="font-mono text-loss">{formatPercent(metrics.worstPerformer.unrealizedPnLPercent)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Manual Holding Button (bottom) */}
        {portfolioItems.length > 0 && (
          <div className="mt-8">
            <button 
              onClick={() => setShowAddHoldingForm(true)}
              className="brutal-btn brutal-btn-secondary w-full"
            >
              + ADD MANUAL HOLDING
            </button>
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      {showAddHoldingForm && (
        <AddHoldingForm 
          onClose={() => setShowAddHoldingForm(false)} 
          userId={currentUser?.uid} 
        />
      )}
    </AppLayout>
  )
}

export default PortfolioPage
