import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-center gap-8 md:gap-12 w-full">
        {/* Character Figure - Left side */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-center z-10 w-1/3 max-w-md">
          <img
            src="/character-side.png"
            alt="Character illustration"
            className="w-auto h-[70vh] max-h-[600px] object-contain opacity-90"
            onError={(e) => {
              console.warn('Character image not found. Please add character-side.png to the public folder.')
              e.target.style.display = 'none'
            }}
          />
        </div>

        {/* Content Box - Right side */}
        <div className="relative z-20 text-left flex-1 max-w-2xl">
          {/* Semi-transparent background for text readability */}
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-gray-800/50">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white drop-shadow-2xl">
              Trade Tracker
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 drop-shadow-lg font-semibold">
              by Doonhamer
            </p>
            <p className="text-base md:text-lg text-gray-300 mb-12 leading-relaxed">
              A tool to manually track your trades.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all duration-200 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-1"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

