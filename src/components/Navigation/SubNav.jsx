import { useNavigate, useLocation } from 'react-router-dom'

const SubNav = ({ tabs, basePath }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active sub-tab from URL
  const getActiveTab = () => {
    const path = location.pathname
    const matchedTab = tabs.find(tab => path === `${basePath}${tab.path}`)
    return matchedTab?.id || tabs[0]?.id
  }

  const activeTab = getActiveTab()

  return (
    <div className="border-b-2 border-black">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`${basePath}${tab.path}`)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
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
    </div>
  )
}

export default SubNav

