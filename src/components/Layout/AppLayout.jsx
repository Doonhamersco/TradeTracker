import { useNavigate } from 'react-router-dom'
import MainNav from '../Navigation/MainNav'
import ProfileDropdown from '../ProfileDropdown'
import { useAuth } from '../../contexts/AuthContext'

const AppLayout = ({ children, title }) => {
  const navigate = useNavigate()
  const { currentUser, userProfile, signout } = useAuth()

  const handleLogout = async () => {
    await signout()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-6 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate('/portfolio')}
              className="brutal-title text-3xl md:text-4xl lg:text-5xl tracking-tight hover:opacity-70 transition-opacity"
            >
              TRADE TRACKER
            </button>
            <ProfileDropdown
              currentUser={currentUser}
              userProfile={userProfile}
              onLogout={handleLogout}
              trades={[]}
              onShowPNL={() => navigate('/analytics')}
              onShowProfile={() => {}}
            />
          </div>
        </div>
        
        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <MainNav />
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
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

export default AppLayout

