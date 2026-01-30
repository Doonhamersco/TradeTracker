import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        {/* Main Content */}
        <div className="brutal-section p-8 md:p-16 text-center">
          <h1 className="brutal-title text-6xl md:text-8xl lg:text-9xl mb-6 tracking-tighter">
            TRADE
            <br />
            TRACKER
          </h1>
          <p className="text-xl md:text-2xl font-bold uppercase tracking-wider mb-4">
            BY DOONHAMER
          </p>
          <p className="text-lg text-gray-600 mb-12 uppercase">
            A TOOL TO MANUALLY TRACK YOUR TRADES
          </p>
          
          <button
            onClick={() => navigate('/login')}
            className="brutal-btn text-xl px-16 py-6"
          >
            GET STARTED →
          </button>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-16 border-t-6 border-black">
            <div className="p-6 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-black">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold uppercase mb-2">TRADE HISTORY</h3>
              <p className="text-sm text-gray-600 uppercase">
                LOG AND TRACK ALL YOUR TRADES
              </p>
            </div>
            <div className="p-6 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-black">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="font-bold uppercase mb-2">PNL CALENDAR</h3>
              <p className="text-sm text-gray-600 uppercase">
                VISUALIZE DAILY PERFORMANCE
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold uppercase mb-2">ACTIVE TRADES</h3>
              <p className="text-sm text-gray-600 uppercase">
                TRACK OPEN POSITIONS LIVE
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm font-mono text-gray-500">
            © {new Date().getFullYear()} TRADE TRACKER
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
