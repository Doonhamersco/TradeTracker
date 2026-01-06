import { useState, useEffect, useRef } from 'react'

const BackgroundVideo = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef(null)

  // Detect mobile devices for performance
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle video loading
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      
      const handleLoadedData = () => {
        console.log('Background video loaded successfully')
        setVideoLoaded(true)
        // Force play in case autoplay was blocked
        video.play().catch(err => {
          console.warn('Video autoplay was prevented:', err)
        })
      }

      const handleError = (e) => {
        console.error('Background video error:', e)
        console.warn('Background video failed to load. Using fallback background.')
        setVideoError(true)
      }

      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
        video.removeEventListener('error', handleError)
      }
    }
  }, [])

  // Don't render video on mobile devices
  if (isMobile) {
    return null
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
        style={{ opacity: 0.3 }}
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Fallback background color */}
      <div className="absolute inset-0 bg-black" />
    </div>
  )
}

export default BackgroundVideo

