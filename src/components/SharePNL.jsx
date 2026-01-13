import { useState, useRef, useEffect } from 'react'
import { Share2, X, Download, Copy } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useAuth } from '../contexts/AuthContext'
import { ref, getBlob } from 'firebase/storage'
import { storage } from '../firebase/config'

const SharePNL = ({ trade }) => {
  const { userProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 1000 })
  const [backgroundDataUrl, setBackgroundDataUrl] = useState(null)
  const [imageReady, setImageReady] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Determine if this is a winning or losing trade
  const isWinning = trade.profitUSD > 0
  const backgroundUrl = isWinning 
    ? (userProfile?.winningTradeBackground || '/jupiter-bg.png')
    : (userProfile?.losingTradeBackground || '/jupiter-bg.png')
  
  // Load image - use Firebase Storage getBlob to bypass CORS issues
  useEffect(() => {
    if (!backgroundUrl) {
      console.log('No backgroundUrl provided')
      return
    }
    
    console.log('Loading background image:', backgroundUrl)
    setImageReady(false)
    
    const loadImage = async () => {
      try {
        // If it's a local file, use it directly
        if (backgroundUrl.startsWith('/')) {
          console.log('Loading local file:', backgroundUrl)
          const img = new Image()
          img.onload = () => {
            console.log('Local image loaded, dimensions:', img.naturalWidth, img.naturalHeight)
            setImageDimensions({ width: img.naturalWidth || img.width || 800, height: img.naturalHeight || img.height || 1000 })
            setBackgroundDataUrl(backgroundUrl)
            setImageReady(true)
          }
          img.onerror = (error) => {
            console.error('Error loading local image:', error)
            setImageReady(false)
          }
          img.src = backgroundUrl
          return
        }
        
        // For Firebase Storage URLs, use Firebase SDK to get blob directly (avoids CORS)
        let dataUrl = backgroundUrl
        
        // Check if it's a Firebase Storage URL
        if (backgroundUrl.includes('firebasestorage.googleapis.com')) {
          console.log('Detected Firebase Storage URL, extracting path...')
          // Extract path from URL: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
          const urlMatch = backgroundUrl.match(/\/o\/([^?]+)/)
          if (!urlMatch) {
            throw new Error('Could not extract path from Firebase Storage URL')
          }
          
          const encodedPath = urlMatch[1]
          const decodedPath = decodeURIComponent(encodedPath)
          console.log('Extracted Storage path:', decodedPath)
          
          // Use Firebase Storage SDK to get blob directly (bypasses CORS)
          const storageRef = ref(storage, decodedPath)
          console.log('Getting blob from Firebase Storage...')
          
          try {
            const blob = await getBlob(storageRef)
            console.log('Got blob from Firebase Storage, size:', blob.size)
            
            // Convert blob to data URL
            dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
            console.log('Converted blob to data URL')
          } catch (error) {
            console.error('getBlob() failed:', error)
            throw new Error(`Failed to get blob from Firebase Storage: ${error.message}`)
          }
        }
        
        // Load image to get dimensions
        const img = new Image()
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Image loaded, dimensions:', img.naturalWidth, img.naturalHeight)
            setImageDimensions({ 
              width: img.naturalWidth || img.width || 800, 
              height: img.naturalHeight || img.height || 1000 
            })
            setBackgroundDataUrl(dataUrl) // Use the data URL (no CORS issues)
            setImageReady(true)
            console.log('✅ Background image loaded successfully')
            resolve()
          }
          img.onerror = (error) => {
            console.error('❌ Error loading image:', error)
            setImageReady(false)
            reject(error)
          }
          img.src = dataUrl
        })
      } catch (error) {
        console.error('❌ Error loading background image:', error)
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          code: error.code,
          backgroundUrl: backgroundUrl?.substring(0, 100)
        })
        setImageReady(false)
      }
    }
    
    loadImage()
  }, [backgroundUrl])

  // Capture the card as an image on-demand (only when exporting)
  const captureCard = async () => {
    if (!cardRef.current || !imageReady) {
      throw new Error('Card not ready')
    }
    
    await document.fonts.ready
    
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 30000
    })
    
    return canvas.toDataURL('image/png')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatCompactCurrency = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return formatCurrency(value)
  }

  const handleShare = async () => {
    if (!imageReady || isExporting) return
    
    setIsExporting(true)
    try {
      const dataUrl = await captureCard()
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `${trade.coinName}-pnl.png`, { type: 'image/png' })
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${trade.coinName} Trade PNL`,
          text: `Check out my ${trade.coinName} trade: ${formatCurrency(trade.profitUSD)} profit!`
        })
      } else {
        // Fallback: download the image
        await handleDownloadWithDataUrl(dataUrl)
      }
    } catch (error) {
      console.error('Error sharing image:', error)
      alert('Error sharing image. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopy = async () => {
    if (!imageReady || isExporting) return
    
    setIsExporting(true)
    try {
      const dataUrl = await captureCard()
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      alert('Image copied to clipboard!')
    } catch (error) {
      console.error('Error copying image:', error)
      alert('Error copying image. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadWithDataUrl = async (dataUrl) => {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trade.coinName}-pnl.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownload = async () => {
    if (!imageReady || isExporting) return
    
    setIsExporting(true)
    try {
      const dataUrl = await captureCard()
      await handleDownloadWithDataUrl(dataUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Error downloading image. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!trade) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${
          isWinning 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
        title="Share PNL"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Share PNL</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Shareable Card Preview - ALWAYS shows the HTML card */}
            <div 
              className="mb-4 rounded-lg overflow-hidden border border-gray-700"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                position: 'relative'
              }}
            >
              {/* Loading state - only while background image loads */}
              {!imageReady && (
                <div className="w-full flex items-center justify-center bg-gray-800" style={{ minHeight: '400px' }}>
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Loading image...</p>
                    <p className="text-gray-500 text-sm">Please wait while we prepare your PNL card</p>
                  </div>
                </div>
              )}
              
              {/* Exporting overlay */}
              {isExporting && (
                <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                  <p className="text-white font-medium">Exporting...</p>
                </div>
              )}
              
              {/* THE PREVIEW - always show this HTML card directly */}
              <div
                ref={cardRef}
                className="relative w-full bg-cover bg-center bg-gradient-to-br from-blue-900 via-purple-900 to-black"
                style={{
                  display: imageReady ? 'block' : 'none',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  backgroundImage: `url(${backgroundDataUrl || backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
                  minHeight: '400px',
                  width: '100%',
                  maxWidth: '100%'
                }}
              >
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20 z-0"></div>
                
                {/* Overlay content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-3">
                  {/* Coin Name - Top Left */}
                  <div className="text-left">
                    <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      {trade.coinName || 'N/A'}
                    </h2>
                  </div>

                  {/* Bottom Section */}
                  <div className="text-left">
                    {/* Profit USD */}
                    <div className="mb-4">
                      <div className={`${isWinning ? 'bg-green-500' : 'bg-red-500'} rounded-lg shadow-xl`} style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 24px',
                        position: 'relative', 
                        zIndex: 1
                      }}>
                        <span className="text-4xl md:text-5xl font-bold text-white whitespace-nowrap" style={{ 
                          color: '#ffffff',
                          WebkitTextFillColor: '#ffffff',
                          textShadow: 'none',
                          lineHeight: '1',
                          display: 'block'
                        }}>
                          {formatCurrency(trade.profitUSD)}
                        </span>
                      </div>
                    </div>

                    {/* Bought and PnL % */}
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-white text-sm mb-1 opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Bought</p>
                        <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          {formatCompactCurrency(trade.entrySize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white text-sm mb-1 opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>PnL %</p>
                        <p className={`text-2xl md:text-3xl font-bold drop-shadow-lg ${isWinning ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          {formatPercent(trade.profitPercent)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SharePNL


