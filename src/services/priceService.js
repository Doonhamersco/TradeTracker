// CoinGecko Price Service
// Note: CoinGecko uses coin IDs (e.g., "bitcoin") not tickers (e.g., "BTC")

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
export const fetchMultiplePrices = async (tickers) => {
  if (!tickers || tickers.length === 0) {
    return { success: true, prices: {} }
  }
  
  // Convert tickers to CoinGecko IDs
  const tickerToIdMap = {}
  const coinIds = []
  
  tickers.forEach(ticker => {
    const coinId = getCoingeckoId(ticker)
    tickerToIdMap[ticker.toUpperCase()] = coinId
    if (!coinIds.includes(coinId)) {
      coinIds.push(coinId)
    }
  })
  
  // Check which ones we need to fetch (not in cache)
  const idsToFetch = coinIds.filter(id => {
    const cached = priceCache.get(id)
    return !cached || Date.now() - cached.timestamp >= CACHE_DURATION
  })
  
  // If all cached, return from cache
  if (idsToFetch.length === 0) {
    const prices = {}
    Object.entries(tickerToIdMap).forEach(([ticker, coinId]) => {
      const cached = priceCache.get(coinId)
      if (cached) {
        prices[ticker] = cached.price
      }
    })
    return { success: true, prices, cached: true }
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 429) {
        // Return cached data if rate limited
        const prices = {}
        Object.entries(tickerToIdMap).forEach(([ticker, coinId]) => {
          const cached = priceCache.get(coinId)
          if (cached) {
            prices[ticker] = cached.price
          }
        })
        return { success: true, prices, rateLimited: true }
      }
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Update cache and build prices object
    Object.entries(data).forEach(([coinId, priceData]) => {
      if (priceData.usd !== undefined) {
        priceCache.set(coinId, { price: priceData.usd, timestamp: Date.now() })
      }
    })
    
    // Build response with all prices (cached + new)
    const prices = {}
    Object.entries(tickerToIdMap).forEach(([ticker, coinId]) => {
      const cached = priceCache.get(coinId)
      if (cached) {
        prices[ticker] = cached.price
      }
    })
    
    return { success: true, prices, cached: false }
  } catch (error) {
    console.error('Error fetching prices:', error)
    return { success: false, error: error.message }
  }
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

