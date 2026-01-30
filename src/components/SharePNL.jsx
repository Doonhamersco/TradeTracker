import { useState, useRef, useEffect } from 'react'
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
  
  const isWinning = trade.profitUSD > 0
  const backgroundUrl = isWinning 
    ? (userProfile?.winningTradeBackground || '/jupiter-bg.png')
    : (userProfile?.losingTradeBackground || '/jupiter-bg.png')
  
  useEffect(() => {
    if (!backgroundUrl) {
      return
    }
    
    setImageReady(false)
    
    const loadImage = async () => {
      try {
        if (backgroundUrl.startsWith('/')) {
          const img = new Image()
          img.onload = () => {
            setImageDimensions({ width: img.naturalWidth || img.width || 800, height: img.naturalHeight || img.height || 1000 })
            setBackgroundDataUrl(backgroundUrl)
            setImageReady(true)
          }
          img.onerror = () => {
            setImageReady(false)
          }
          img.src = backgroundUrl
          return
        }
        
        let dataUrl = backgroundUrl
        
        if (backgroundUrl.includes('firebasestorage.googleapis.com')) {
          const urlMatch = backgroundUrl.match(/\/o\/([^?]+)/)
          if (!urlMatch) {
            throw new Error('Could not extract path from Firebase Storage URL')
          }
          
          const encodedPath = urlMatch[1]
          const decodedPath = decodeURIComponent(encodedPath)
          
          const storageRef = ref(storage, decodedPath)
          
          try {
            const blob = await getBlob(storageRef)
            
            dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
          } catch (error) {
            throw new Error(`Failed to get blob from Firebase Storage: ${error.message}`)
          }
        }
        
        const img = new Image()
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            setImageDimensions({ 
              width: img.naturalWidth || img.width || 800, 
              height: img.naturalHeight || img.height || 1000 
            })
            setBackgroundDataUrl(dataUrl)
            setImageReady(true)
            resolve()
          }
          img.onerror = (error) => {
            setImageReady(false)
            reject(error)
          }
          img.src = dataUrl
        })
      } catch (error) {
        console.error('Error loading background image:', error)
        setImageReady(false)
      }
    }
    
    loadImage()
  }, [backgroundUrl])

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
        className={`border-2 px-3 py-1 text-xs font-bold uppercase transition-colors ${
          isWinning 
            ? 'border-green-700 text-green-700 hover:bg-green-700 hover:text-white' 
            : 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white'
        }`}
        title="Share PNL"
      >
        SHARE
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="brutal-section w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b-6 border-black p-6 flex items-center justify-between">
              <h3 className="brutal-title text-xl">SHARE PNL</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Card Preview */}
            <div className="p-6">
              <div 
                className="mb-4 border-2 border-black overflow-hidden"
                style={{
                  userSelect: 'none',
                  position: 'relative'
                }}
              >
                {!imageReady && (
                  <div className="w-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px' }}>
                    <p className="font-bold uppercase">LOADING IMAGE...</p>
                  </div>
                )}
                
                {isExporting && (
                  <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                    <p className="text-white font-bold uppercase">EXPORTING...</p>
                  </div>
                )}
                
                <div
                  ref={cardRef}
                  className="relative w-full bg-cover bg-center bg-gradient-to-br from-blue-900 via-purple-900 to-black"
                  style={{
                    display: imageReady ? 'block' : 'none',
                    pointerEvents: 'none',
                    backgroundImage: `url(${backgroundDataUrl || backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
                    minHeight: '400px',
                    width: '100%'
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 z-0"></div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between p-3">
                    <div className="text-left">
                      <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {trade.coinName || 'N/A'}
                      </h2>
                    </div>

                    <div className="text-left">
                      <div className="mb-4">
                        <div className={`${isWinning ? 'bg-green-500' : 'bg-red-500'} shadow-xl`} style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 24px'
                        }}>
                          <span className="text-4xl md:text-5xl font-bold text-white whitespace-nowrap" style={{ 
                            color: '#ffffff',
                            lineHeight: '1'
                          }}>
                            {formatCurrency(trade.profitUSD)}
                          </span>
                        </div>
                      </div>

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
              <div className="grid grid-cols-3 border-2 border-black">
                <button
                  onClick={handleShare}
                  disabled={isExporting}
                  className="p-4 font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black disabled:opacity-50"
                >
                  SHARE
                </button>
                <button
                  onClick={handleCopy}
                  disabled={isExporting}
                  className="p-4 font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black disabled:opacity-50"
                >
                  COPY
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="p-4 font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                >
                  DOWNLOAD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SharePNL
