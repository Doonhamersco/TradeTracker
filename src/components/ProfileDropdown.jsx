import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, TrendingUp, Settings, LogOut } from 'lucide-react'

const ProfileDropdown = ({ currentUser, userProfile, onLogout, trades, onShowPNL, onShowProfile }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getUserDisplayName = () => {
    if (currentUser?.email) {
      return currentUser.email
    }
    if (currentUser?.displayName) {
      return currentUser.displayName
    }
    if (userProfile?.username) {
      return userProfile.username
    }
    return 'User'
  }

  const handlePNLClick = () => {
    setIsOpen(false)
    if (onShowPNL) {
      onShowPNL()
    } else {
      navigate('/pnl')
    }
  }

  const handleProfileClick = () => {
    setIsOpen(false)
    onShowProfile()
  }

  const handleLogoutClick = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
        aria-label="User menu"
      >
        <User className="w-5 h-5 text-white" />
        {isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {/* PNL Menu Item */}
            <button
              onClick={handlePNLClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-gray-800 transition-colors duration-150 first:rounded-t-lg"
            >
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">PNL 📈</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-800 my-1"></div>

            {/* Profile Menu Item */}
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-gray-800 transition-colors duration-150"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">Profile ⚙️</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-800 my-1"></div>

            {/* Log Out Menu Item */}
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-red-400 hover:bg-gray-800 transition-colors duration-150 last:rounded-b-lg"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown

