import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import PNLCalendar from '../components/PNLCalendar'
import WinRateStats from '../components/WinRateStats'
import PNLSummary from '../components/PNLSummary'

const PNLPage = ({ trades }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('calendar')

  const tabs = [
    { id: 'calendar', label: 'PNL Calendar', icon: Calendar },
    { id: 'summary', label: 'PNL Summary', icon: TrendingUp },
    { id: 'winrate', label: 'Win Rate', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen text-white relative z-10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/trades')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Trades</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            PNL Analytics
          </h1>
          <p className="text-gray-400 text-lg">Comprehensive profit and loss analysis</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-900 rounded-xl shadow-2xl p-2 mb-6 border border-gray-800">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 border border-gray-800">
          {activeTab === 'calendar' && <PNLCalendar trades={trades} />}
          {activeTab === 'summary' && <PNLSummary trades={trades} />}
          {activeTab === 'winrate' && <WinRateStats trades={trades} />}
        </div>
      </div>
    </div>
  )
}

export default PNLPage

