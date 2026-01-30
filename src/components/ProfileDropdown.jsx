import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const ProfileDropdown = ({ currentUser, userProfile, onLogout, trades, onShowPNL, onShowProfile }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

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
    if (userProfile?.username) {
      return userProfile.username
    }
    if (currentUser?.displayName) {
      return currentUser.displayName
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]
    }
    return 'USER'
  }

  const handlePNLClick = () => {
    setIsOpen(false)
    if (onShowPNL) {
      onShowPNL()
    } else {
      navigate('/analytics')
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
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center font-bold text-sm"
        aria-label="User menu"
      >
        {getUserDisplayName().charAt(0).toUpperCase()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 brutal-section z-50">
          <div className="divide-y-2 divide-black">
            {/* PNL */}
            <button
              onClick={handlePNLClick}
              className="w-full px-4 py-3 text-left text-sm font-bold uppercase hover:bg-black hover:text-white transition-colors"
            >
              📈 PNL ANALYTICS
            </button>

            {/* Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-3 text-left text-sm font-bold uppercase hover:bg-black hover:text-white transition-colors"
            >
              ⚙️ PROFILE
            </button>

            {/* Log Out */}
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-3 text-left text-sm font-bold uppercase text-loss hover:bg-loss hover:text-white transition-colors"
            >
              ← LOG OUT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
