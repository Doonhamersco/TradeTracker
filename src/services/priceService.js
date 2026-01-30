// Price Service - CoinGecko + Hyperliquid
// Note: CoinGecko uses coin IDs (e.g., "bitcoin") not tickers (e.g., "BTC")
// Hyperliquid tokens use their native API

// Tokens known to be on Hyperliquid (will use Hyperliquid API)
// This list auto-expands when we find tokens on Hyperliquid
const HYPERLIQUID_TOKENS = new Set([
  // Native Hyperliquid tokens
  'XPL', 'HYPE', 'PURR', 'JEFF', 'CATBAL', 'BUDDY', 'FARM', 'RAGE', 
  'POINTS', 'PIP', 'VAPOR', 'ANIME', 'LIQD', 'TRUMP', 'MELANIA',
  'SOLV', 'UBTC', 'STBTC', 'MON', 'LHYPE', 'USDE', 'SUSDE'
])

// Common ticker to CoinGecko ID mapping
const TICKER_TO_ID = {
  // Major coins
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'FTM': 'fantom',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'JUP': 'jupiter-exchange-solana',
  'PYTH': 'pyth-network',
  'JTO': 'jito-governance-token',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'PEPE': 'pepe',
  'SHIB': 'shiba-inu',
  'FLOKI': 'floki',
  'RENDER': 'render-token',
  'FET': 'fetch-ai',
  'RNDR': 'render-token',
  'AI16Z': 'ai16z',
  'VIRTUAL': 'virtual-protocol',
  'FARTCOIN': 'fartcoin',
  'GOAT': 'goatseus-maximus',
  'ZEREBRO': 'zerebro',
  'ARC': 'ai-rig-complex',
  'GRIFFAIN': 'griffain',
  'AIXBT': 'aixbt',
  'ELIZA': 'eliza',
  'SWARMS': 'swarms',
  'PENGU': 'pudgy-penguins',
  'HYPE': 'hyperliquid',
  'XPL': 'xpl', // Might not exist
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'MNDE': 'marinade',
  'MSOL': 'msol',
  'JITOSOL': 'jito-staked-sol',
}

// Cache for prices to avoid excessive API calls
const priceCache = new Map()
const CACHE_DURATION = 30000 // 30 seconds

// Hyperliquid prices cache (both spot and perps)
let hyperliquidPricesCache = null
let hyperliquidLastFetch = 0

// Check if token is on Hyperliquid
export const isHyperliquidToken = (ticker) => {
  return HYPERLIQUID_TOKENS.has(ticker.toUpperCase())
}

// Fetch Hyperliquid PERPS prices (this is where most tokens are)
export const fetchHyperliquidPerpPrices = async () => {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'allMids' })
    })
    
    if (!response.ok) {
      throw new Error(`Hyperliquid perps API error: ${response.status}`)
    }
    
    const data = await response.json()
    // data is an object like { "BTC": "42000.5", "ETH": "2500.3", "XPL": "0.134", ... }
    
    const prices = {}
    Object.entries(data).forEach(([symbol, price]) => {
      prices[symbol.toUpperCase()] = parseFloat(price)
    })
    
    console.log('Hyperliquid perps prices fetched:', Object.keys(prices).length, 'tokens')
    
    return { success: true, prices }
  } catch (error) {
    console.error('Error fetching Hyperliquid perps prices:', error)
    return { success: false, error: error.message }
  }
}

// Fetch all Hyperliquid prices (perps + spot combined)
export const fetchHyperliquidPrices = async () => {
  // Check cache
  if (hyperliquidPricesCache && Date.now() - hyperliquidLastFetch < CACHE_DURATION) {
    return { success: true, prices: hyperliquidPricesCache, cached: true }
  }
  
  const prices = {}
  
  // First, fetch PERPS prices (this is where most tokens like XPL are)
  const perpResult = await fetchHyperliquidPerpPrices()
  if (perpResult.success) {
    Object.assign(prices, perpResult.prices)
  }
  
  // Then fetch spot prices and merge (spot prices override perps if both exist)
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'spotMetaAndAssetCtxs' })
    })
    
    if (response.ok) {
      const data = await response.json()
      const spotMeta = data[0]
      const contexts = data[1] || []
      const tokens = spotMeta?.tokens || []
      
      if (spotMeta?.universe) {
        spotMeta.universe.forEach((pair, index) => {
          const ctx = contexts[index]
          if (ctx && ctx.midPx) {
            const baseTokenIdx = pair.tokens?.[0]
            
            if (baseTokenIdx !== undefined && tokens[baseTokenIdx]) {
              const baseToken = tokens[baseTokenIdx]
              const symbol = baseToken.name?.toUpperCase()
              
              if (symbol && !symbol.startsWith('@')) {
                prices[symbol] = parseFloat(ctx.midPx)
              }
            }
            
            if (pair.name && !pair.name.startsWith('@')) {
              const pairName = pair.name.split('/')[0]?.toUpperCase()
              if (pairName && !prices[pairName]) {
                prices[pairName] = parseFloat(ctx.midPx)
              }
            }
          }
        })
      }
    }
  } catch (error) {
    console.error('Error fetching Hyperliquid spot prices:', error)
  }
  
  console.log('Hyperliquid total prices:', Object.keys(prices).length)
  console.log('XPL price:', prices['XPL'])
  
  hyperliquidPricesCache = prices
  hyperliquidLastFetch = Date.now()
  
  return { success: true, prices, cached: false }
}

// Get single Hyperliquid price
export const getHyperliquidPrice = async (ticker) => {
  const result = await fetchHyperliquidPrices()
  if (result.success && result.prices[ticker.toUpperCase()]) {
    return { success: true, price: result.prices[ticker.toUpperCase()] }
  }
  return { success: false, error: 'Token not found on Hyperliquid' }
}

// Get CoinGecko ID from ticker
export const getCoingeckoId = (ticker) => {
  const upperTicker = ticker.toUpperCase()
  return TICKER_TO_ID[upperTicker] || ticker.toLowerCase()
}

// Fetch single price
export const fetchPrice = async (ticker) => {
  const coinId = getCoingeckoId(ticker)
  
  // Check cache first
  const cached = priceCache.get(coinId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { success: true, price: cached.price, cached: true }
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limited. Please wait a moment.' }
      }
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data[coinId] && data[coinId].usd !== undefined) {
      const price = data[coinId].usd
      // Update cache
      priceCache.set(coinId, { price, timestamp: Date.now() })
      return { success: true, price, cached: false }
    } else {
      return { success: false, error: `Price not found for ${ticker}` }
    }
  } catch (error) {
    console.error('Error fetching price:', error)
    return { success: false, error: error.message }
  }
}

// Fetch multiple prices at once (more efficient)
// Uses CoinGecko for major coins and Hyperliquid for HL-native tokens
export const fetchMultiplePrices = async (tickers) => {
  if (!tickers || tickers.length === 0) {
    return { success: true, prices: {} }
  }
  
  const prices = {}
  const upperTickers = tickers.map(t => t.toUpperCase())
  
  // Separate Hyperliquid tokens from CoinGecko tokens
  const hlTickers = upperTickers.filter(t => isHyperliquidToken(t))
  const cgTickers = upperTickers.filter(t => !isHyperliquidToken(t))
  
  // Fetch Hyperliquid prices first
  if (hlTickers.length > 0) {
    console.log('Fetching Hyperliquid prices for:', hlTickers)
    const hlResult = await fetchHyperliquidPrices()
    if (hlResult.success) {
      hlTickers.forEach(ticker => {
        if (hlResult.prices[ticker] !== undefined) {
          prices[ticker] = hlResult.prices[ticker]
        }
      })
    }
  }
  
  // Fetch CoinGecko prices
  if (cgTickers.length > 0) {
    // Convert tickers to CoinGecko IDs
    const tickerToIdMap = {}
    const coinIds = []
    
    cgTickers.forEach(ticker => {
      const coinId = getCoingeckoId(ticker)
      tickerToIdMap[ticker] = coinId
      if (!coinIds.includes(coinId)) {
        coinIds.push(coinId)
      }
    })
    
    // Check which ones we need to fetch (not in cache)
    const idsToFetch = coinIds.filter(id => {
      const cached = priceCache.get(id)
      return !cached || Date.now() - cached.timestamp >= CACHE_DURATION
    })
    
    // Get cached prices first
    Object.entries(tickerToIdMap).forEach(([ticker, coinId]) => {
      const cached = priceCache.get(coinId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        prices[ticker] = cached.price
      }
    })
    
    // Fetch new prices if needed
    if (idsToFetch.length > 0) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          
          // Update cache and build prices object
          Object.entries(data).forEach(([coinId, priceData]) => {
            if (priceData.usd !== undefined) {
              priceCache.set(coinId, { price: priceData.usd, timestamp: Date.now() })
            }
          })
          
          // Add newly fetched prices
          Object.entries(tickerToIdMap).forEach(([ticker, coinId]) => {
            const cached = priceCache.get(coinId)
            if (cached) {
              prices[ticker] = cached.price
            }
          })
        } else if (response.status === 429) {
          console.warn('CoinGecko rate limited, using cached data')
        }
      } catch (error) {
        console.error('Error fetching CoinGecko prices:', error)
      }
    }
  }
  
  // For any tickers still missing, try Hyperliquid as fallback
  const missingTickers = upperTickers.filter(t => prices[t] === undefined)
  if (missingTickers.length > 0) {
    console.log('Trying Hyperliquid for missing tickers:', missingTickers)
    const hlResult = await fetchHyperliquidPrices()
    if (hlResult.success) {
      missingTickers.forEach(ticker => {
        if (hlResult.prices[ticker] !== undefined) {
          prices[ticker] = hlResult.prices[ticker]
          // Add to known Hyperliquid tokens for future
          HYPERLIQUID_TOKENS.add(ticker)
        }
      })
    }
  }
  
  console.log('Final prices:', prices)
  return { success: true, prices }
}

// Add custom ticker mapping (for coins not in our list)
export const addTickerMapping = (ticker, coingeckoId) => {
  TICKER_TO_ID[ticker.toUpperCase()] = coingeckoId.toLowerCase()
}

// Search for a coin on CoinGecko (useful for finding the right ID)
export const searchCoin = async (query) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const data = await response.json()
    return { 
      success: true, 
      coins: data.coins?.slice(0, 10).map(coin => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        thumb: coin.thumb
      })) || []
    }
  } catch (error) {
    console.error('Error searching coins:', error)
    return { success: false, error: error.message }
  }
}



