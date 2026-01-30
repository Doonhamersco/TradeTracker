import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PNLCalendar from '../components/PNLCalendar'
import WinRateStats from '../components/WinRateStats'
import PNLSummary from '../components/PNLSummary'

const PNLPage = ({ trades }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('calendar')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-6 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/trades')}
                className="text-sm font-bold uppercase tracking-wider hover:underline mb-4 inline-block"
              >
                ← BACK TO TRADES
              </button>
              <h1 className="brutal-title text-4xl md:text-6xl lg:text-7xl tracking-tight">
                PNL ANALYTICS
              </h1>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-0 mt-8">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`brutal-tab ${activeTab === 'calendar' ? 'brutal-tab-active' : 'brutal-tab-inactive'}`}
            >
              PNL CALENDAR
            </button>
            <button 
              onClick={() => setActiveTab('summary')}
              className={`brutal-tab ${activeTab === 'summary' ? 'brutal-tab-active' : 'brutal-tab-inactive'}`}
            >
              PNL SUMMARY
            </button>
            <button 
              onClick={() => setActiveTab('winrate')}
              className={`brutal-tab ${activeTab === 'winrate' ? 'brutal-tab-active' : 'brutal-tab-inactive'}`}
            >
              WIN RATE
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <section className="brutal-section">
          <div className="p-8">
            {activeTab === 'calendar' && <PNLCalendar trades={trades} />}
            {activeTab === 'summary' && <PNLSummary trades={trades} />}
            {activeTab === 'winrate' && <WinRateStats trades={trades} />}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-6 border-black mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex justify-between items-center">
          <p className="text-sm font-bold uppercase tracking-wider">
            TRADE TRACKER BY DOONHAMER
          </p>
          <p className="text-sm font-mono">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PNLPage
