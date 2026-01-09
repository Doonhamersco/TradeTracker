import { useState, useRef, useEffect } from 'react'
import { Share2, X, Download, Copy } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useAuth } from '../contexts/AuthContext'
import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

const SharePNL = ({ trade }) => {
  const { userProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 1000 })
  const [backgroundDataUrl, setBackgroundDataUrl] = useState(null)
  const [imageReady, setImageReady] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null) // Store the generated image
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  
  // Determine if this is a winning or losing trade
  const isWinning = trade.profitUSD > 0
  const backgroundUrl = isWinning 
    ? (userProfile?.winningTradeBackground || '/jupiter-bg.png')
    : (userProfile?.losingTradeBackground || '/jupiter-bg.png')
  
  // Load image - use Firebase Storage getDownloadURL for proper signed URLs
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
        
        // For Firebase Storage URLs, use Firebase SDK to get download URL (avoids CORS)
        let finalUrl = backgroundUrl
        
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
          
          // Use Firebase Storage SDK to get a signed download URL (no CORS issues)
          const storageRef = ref(storage, decodedPath)
          console.log('Getting download URL from Firebase Storage...')
          
          try {
            const downloadURL = await getDownloadURL(storageRef)
            console.log('Got download URL from Firebase Storage')
            // Use the download URL directly - no need to convert to blob/data URL
            finalUrl = downloadURL
          } catch (error) {
            console.error('getDownloadURL() failed:', error)
            throw new Error(`Failed to get download URL from Firebase Storage: ${error.message}`)
          }
        }
        
        // Load image to get dimensions and verify it loads
        const img = new Image()
        img.crossOrigin = 'anonymous' // Allow CORS for the image
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Image loaded, dimensions:', img.naturalWidth, img.naturalHeight)
            setImageDimensions({ 
              width: img.naturalWidth || img.width || 800, 
              height: img.naturalHeight || img.height || 1000 
            })
            setBackgroundDataUrl(finalUrl) // Use the URL directly, no need for data URL
            setImageReady(true)
            console.log('✅ Background image loaded successfully')
            resolve()
          }
          img.onerror = (error) => {
            console.error('❌ Error loading image:', error)
            setImageReady(false)
            reject(error)
          }
          img.src = finalUrl
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

  // Generate the image when modal opens and image is ready
  useEffect(() => {
    if (isOpen && imageReady && !generatedImageUrl && !isGeneratingImage && cardRef.current) {
      generatePreviewImage()
    }
  }, [isOpen, imageReady, generatedImageUrl, isGeneratingImage])

  // Generate preview image
  const generatePreviewImage = async () => {
    if (!cardRef.current || !imageReady) {
      console.warn('Cannot generate preview: cardRef or imageReady not available')
      return
    }
    
    setIsGeneratingImage(true)
    try {
      // Ensure card is visible for capture
      const cardElement = cardRef.current
      const originalDisplay = cardElement.style.display
      cardElement.style.display = 'block'
      cardElement.style.visibility = 'visible'
      cardElement.style.opacity = '1'
      
      // Wait a bit for the element to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await captureCard()
      const dataUrl = canvas.toDataURL('image/png')
      console.log('Preview image generated, setting generatedImageUrl')
      setGeneratedImageUrl(dataUrl)
      
      // Restore original display (will be hidden by conditional rendering anyway)
      cardElement.style.display = originalDisplay
    } catch (error) {
      console.error('Error generating preview image:', error)
    } finally {
      setIsGeneratingImage(false)
    }
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

  const captureCard = async () => {
    if (!cardRef.current) {
      throw new Error('Card element not found')
    }
    
    if (!imageReady) {
      throw new Error('Background image not ready. Please wait a moment.')
    }
    
    const cardElement = cardRef.current
    
    // Ensure all fonts are loaded before capture
    await document.fonts.ready
    
    // Wait a bit to ensure everything is rendered, especially text and images
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Force multiple reflows to ensure all text is rendered
    cardElement.offsetHeight
    void cardElement.offsetWidth
    
    // Get exact dimensions
    const elementWidth = cardElement.offsetWidth
    const elementHeight = cardElement.offsetHeight
    const scrollWidth = cardElement.scrollWidth
    const scrollHeight = cardElement.scrollHeight
    
    console.log('Capturing card with dimensions:', elementWidth, 'x', elementHeight)
    
    return await html2canvas(cardElement, {
      backgroundColor: null, // Transparent background
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: true, // Changed to true to allow cross-origin images
      foreignObjectRendering: false,
      imageTimeout: 30000, // Increased timeout
      removeContainer: true,
      width: elementWidth,
      height: elementHeight,
      windowWidth: scrollWidth,
      windowHeight: scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedElement) => {
        console.log('Cloning element for html2canvas...')
        
        // Ensure the cloned card element has proper styling
        if (clonedElement) {
          clonedElement.style.display = 'block'
          clonedElement.style.visibility = 'visible'
          clonedElement.style.opacity = '1'
          clonedElement.style.width = `${elementWidth}px`
          clonedElement.style.height = `${elementHeight}px`
        }
        
        // Ensure all text elements are visible and properly styled in the clone
        const profitBoxes = clonedDoc.querySelectorAll('[class*="bg-green-500"], [class*="bg-red-500"]')
        profitBoxes.forEach(box => {
          // Apply flexbox centering for perfect vertical alignment
          box.style.display = 'flex'
          box.style.alignItems = 'center'
          box.style.justifyContent = 'center'
          box.style.width = 'fit-content'
          box.style.maxWidth = '100%'
          box.style.padding = '8px 24px' // Equal padding for proper centering
          box.style.opacity = '1'
          box.style.visibility = 'visible'
          box.style.position = 'relative'
          box.style.zIndex = '1'
          
          const textElement = box.querySelector('span, div')
          if (textElement) {
            // Force text to be visible and properly styled with higher z-index
            textElement.style.color = '#ffffff'
            textElement.style.webkitTextFillColor = '#ffffff'
            textElement.style.opacity = '1'
            textElement.style.visibility = 'visible'
            textElement.style.display = 'block'
            textElement.style.margin = '0'
            textElement.style.padding = '0'
            textElement.style.position = 'relative'
            textElement.style.zIndex = '10'
            textElement.style.lineHeight = '1'
          }
        })
        
        // Ensure all other text elements are visible
        const allTextElements = clonedDoc.querySelectorAll('h2, p, span')
        allTextElements.forEach(el => {
          const computedStyle = window.getComputedStyle(el)
          if (computedStyle.color !== 'transparent' && computedStyle.opacity !== '0') {
            el.style.visibility = 'visible'
            el.style.opacity = '1'
            el.style.position = 'relative'
            el.style.zIndex = '10'
          }
        })
        
        console.log('Clone preparation complete')
      }
    })
  }

  const handleShare = async () => {
    if (!cardRef.current) {
      alert('Card not ready. Please wait for the image to load.')
      return
    }

    if (!imageReady) {
      alert('Image is still loading. Please wait a moment and try again.')
      return
    }

    try {
      const canvas = await captureCard()

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${trade.coinName}-pnl.png`, { type: 'image/png' })
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: `${trade.coinName} Trade PNL`,
              text: `Check out my ${trade.coinName} trade: ${formatCurrency(trade.profitUSD)} profit!`
            })
          } else {
            // Fallback: download the image
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${trade.coinName}-pnl.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error generating share image:', error)
      alert('Error generating share image. Please try again.')
    }
  }

  const handleCopy = async () => {
    if (!generatedImageUrl) {
      alert('Image not ready. Please wait for the preview to generate.')
      return
    }

    try {
      // Convert the generated image data URL to a blob
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        alert('Image copied to clipboard!')
      } catch (error) {
        console.error('Clipboard API error:', error)
        // Fallback: download
        handleDownload()
      }
    } catch (error) {
      console.error('Error copying image:', error)
      alert('Error copying image. Please try again.')
    }
  }

  const handleDownload = async () => {
    if (!generatedImageUrl) {
      alert('Image not ready. Please wait for the preview to generate.')
      return
    }

    try {
      // Convert the generated image data URL to a blob
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${trade.coinName}-pnl.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Error downloading image. Please try again.')
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
                onClick={() => {
                  setIsOpen(false)
                  // Reset generated image when modal closes
                  setGeneratedImageUrl(null)
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Shareable Card Preview */}
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
              {!imageReady && (
                <div className="w-full flex items-center justify-center bg-gray-800" style={{ minHeight: '400px' }}>
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Loading image...</p>
                    <p className="text-gray-500 text-sm">Please wait while we prepare your PNL card</p>
                  </div>
                </div>
              )}
              {isGeneratingImage && imageReady && (
                <div className="w-full flex items-center justify-center bg-gray-800" style={{ minHeight: '400px' }}>
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Generating image...</p>
                    <p className="text-gray-500 text-sm">Please wait</p>
                  </div>
                </div>
              )}
              {generatedImageUrl && !isGeneratingImage && (
                <img
                  src={generatedImageUrl}
                  alt="PNL Card"
                  className="w-full h-auto"
                  style={{
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    pointerEvents: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserDrag: 'none',
                    KhtmlUserSelect: 'none',
                    cursor: 'default',
                    position: 'relative',
                    zIndex: 10
                  }}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              )}
              {/* Always render card for capture, but make it completely invisible and non-interactive when image is generated */}
              <div
                ref={cardRef}
                className="relative w-full bg-cover bg-center bg-gradient-to-br from-blue-900 via-purple-900 to-black"
                style={{
                  display: (imageReady && !generatedImageUrl) || isGeneratingImage ? 'block' : 'none',
                  position: generatedImageUrl ? 'absolute' : 'relative',
                  top: generatedImageUrl ? '-9999px' : 'auto',
                  left: generatedImageUrl ? '-9999px' : 'auto',
                  visibility: generatedImageUrl ? 'hidden' : 'visible',
                  opacity: generatedImageUrl ? '0' : '1',
                  pointerEvents: generatedImageUrl ? 'none' : 'auto',
                  userSelect: generatedImageUrl ? 'none' : 'auto',
                  zIndex: generatedImageUrl ? '-1' : '1',
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
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
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
                      <div className={`${isWinning ? 'bg-green-500' : 'bg-red-500'} rounded-lg inline-flex items-center justify-center shadow-xl`} style={{ 
                        width: 'fit-content', 
                        maxWidth: '100%', 
                        position: 'relative', 
                        zIndex: 1,
                        padding: '8px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="text-4xl md:text-5xl font-bold text-white whitespace-nowrap" style={{ 
                          color: '#ffffff',
                          WebkitTextFillColor: '#ffffff',
                          textShadow: 'none',
                          position: 'relative',
                          zIndex: 10,
                          lineHeight: '1'
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

