/**
 * Exchange Rate Service
 * Fetches GBP/USD exchange rate from free APIs
 */

const FALLBACK_RATE = 1.25 // Reasonable fallback if API fails

/**
 * Fetch current GBP to USD exchange rate
 * Uses Frankfurter API (free, no API key required)
 */
export const fetchGBPUSDRate = async () => {
  try {
    // Primary: Frankfurter API (free, reliable)
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=GBP&to=USD'
    )
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      rate: data.rates.USD,
      date: data.date,
      source: 'auto',
      fetchedAt: Date.now()
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    
    // Try backup API
    try {
      return await fetchFromBackupAPI()
    } catch (backupError) {
      console.error('Backup API also failed:', backupError)
      
      return {
        success: false,
        error: error.message,
        rate: FALLBACK_RATE,
        source: 'fallback',
        fetchedAt: Date.now()
      }
    }
  }
}

/**
 * Backup API: Exchange Rate API (free tier)
 */
const fetchFromBackupAPI = async () => {
  const response = await fetch(
    'https://open.er-api.com/v6/latest/GBP'
  )
  
  if (!response.ok) {
    throw new Error(`Backup API responded with status ${response.status}`)
  }
  
  const data = await response.json()
  
  return {
    success: true,
    rate: data.rates.USD,
    date: data.time_last_update_utc?.split(' ')[0] || new Date().toISOString().split('T')[0],
    source: 'auto',
    fetchedAt: Date.now()
  }
}

/**
 * Convert USD to GBP using a given rate
 */
export const convertUSDToGBP = (usdAmount, gbpusdRate) => {
  if (!gbpusdRate || gbpusdRate <= 0) {
    return usdAmount / FALLBACK_RATE
  }
  return usdAmount / gbpusdRate
}

/**
 * Convert GBP to USD using a given rate
 */
export const convertGBPToUSD = (gbpAmount, gbpusdRate) => {
  if (!gbpusdRate || gbpusdRate <= 0) {
    return gbpAmount * FALLBACK_RATE
  }
  return gbpAmount * gbpusdRate
}

/**
 * Format exchange rate for display
 */
export const formatExchangeRate = (rate) => {
  return `£1 = $${rate.toFixed(4)}`
}

/**
 * Validate exchange rate is within reasonable bounds
 */
export const validateExchangeRate = (rate) => {
  // GBP/USD has historically been between 1.0 and 2.5
  const MIN_RATE = 0.8
  const MAX_RATE = 3.0
  
  if (rate < MIN_RATE || rate > MAX_RATE) {
    return {
      valid: false,
      error: `Rate ${rate} is outside expected range (${MIN_RATE} - ${MAX_RATE})`
    }
  }
  
  return { valid: true }
}

