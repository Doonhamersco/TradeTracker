import { useNavigate, useLocation } from 'react-router-dom'

const MainNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active section from URL
  const getActiveSection = () => {
    const path = location.pathname
    if (path.startsWith('/portfolio')) return 'portfolio'
    if (path.startsWith('/trades')) return 'trades'
    if (path.startsWith('/analytics')) return 'analytics'
    return 'portfolio' // default
  }

  const activeSection = getActiveSection()

  const tabs = [
    { id: 'portfolio', label: 'PORTFOLIO', path: '/portfolio' },
    { id: 'trades', label: 'TRADES', path: '/trades' },
    { id: 'analytics', label: 'ANALYTICS', path: '/analytics' },
  ]

  return (
    <nav className="border-b-6 border-black">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'bg-white text-black border-r-2 border-black last:border-r-0 hover:bg-black hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MainNav

