import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage } from '../services/storageService'

const ProfileModal = ({ isOpen, onClose, currentUser, userProfile }) => {
  const { updateUserProfile } = useAuth()
  const [uploadingWinning, setUploadingWinning] = useState(false)
  const [uploadingLosing, setUploadingLosing] = useState(false)
  const [previewWinning, setPreviewWinning] = useState(null)
  const [previewLosing, setPreviewLosing] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({ winning: 0, losing: 0 })
  const [uploadError, setUploadError] = useState({ winning: null, losing: null })
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false)
  const [displayNameValue, setDisplayNameValue] = useState('')
  const [savingDisplayName, setSavingDisplayName] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsEditingDisplayName(false)
      return
    }
    
    try {
      if (userProfile?.displayName) {
        setDisplayNameValue(userProfile.displayName)
      } else if (currentUser?.displayName) {
        setDisplayNameValue(currentUser.displayName)
      } else if (currentUser?.email) {
        setDisplayNameValue(currentUser.email)
      } else if (userProfile?.username) {
        setDisplayNameValue(userProfile.username)
      } else {
        setDisplayNameValue('')
      }
    } catch (error) {
      console.error('Error initializing display name:', error)
      setDisplayNameValue('')
    }
  }, [userProfile, currentUser, isOpen])

  if (!isOpen) return null

  const getUserDisplayName = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
    }
    if (currentUser?.displayName) {
      return currentUser.displayName
    }
    if (currentUser?.email) {
      return currentUser.email
    }
    if (userProfile?.username) {
      return userProfile.username
    }
    return 'USER'
  }

  const handleSaveDisplayName = async () => {
    if (!currentUser?.uid) return

    const trimmedName = displayNameValue.trim()
    if (!trimmedName) {
      alert('Display name cannot be empty')
      return
    }

    setSavingDisplayName(true)
    try {
      const result = await updateUserProfile(currentUser.uid, {
        displayName: trimmedName
      })

      if (result.success) {
        setIsEditingDisplayName(false)
      } else {
        alert('Error updating display name: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving display name:', error)
      alert('Error saving display name. Please try again.')
    } finally {
      setSavingDisplayName(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date).toUpperCase()
    } catch {
      return 'N/A'
    }
  }

  const handleImageUpload = async (file, type) => {
    if (!file || !currentUser?.uid) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    if (type === 'winning') {
      setUploadError({ ...uploadError, winning: null })
      setUploadingWinning(true)
      setUploadProgress({ ...uploadProgress, winning: 0 })
    } else {
      setUploadError({ ...uploadError, losing: null })
      setUploadingLosing(true)
      setUploadProgress({ ...uploadProgress, losing: 0 })
    }

    try {
      const result = await uploadImage(
        file, 
        currentUser.uid, 
        type,
        (progress) => {
          if (type === 'winning') {
            setUploadProgress({ ...uploadProgress, winning: progress })
          } else {
            setUploadProgress({ ...uploadProgress, losing: progress })
          }
        }
      )
      
      if (result.success) {
        const updateData = {}
        if (type === 'winning') {
          updateData.winningTradeBackground = result.url
        } else {
          updateData.losingTradeBackground = result.url
        }

        const updateResult = await updateUserProfile(currentUser.uid, updateData)
        
        if (updateResult.success) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (type === 'winning') {
              setPreviewWinning(e.target.result)
            } else {
              setPreviewLosing(e.target.result)
            }
          }
          reader.readAsDataURL(file)
          
          if (type === 'winning') {
            setUploadProgress({ ...uploadProgress, winning: 100 })
          } else {
            setUploadProgress({ ...uploadProgress, losing: 100 })
          }
        } else {
          const errorMsg = 'Error updating profile: ' + (updateResult.error || 'Unknown error')
          if (type === 'winning') {
            setUploadError({ ...uploadError, winning: errorMsg })
          } else {
            setUploadError({ ...uploadError, losing: errorMsg })
          }
        }
      } else {
        const errorMsg = 'Error uploading image: ' + (result.error || 'Unknown error')
        if (type === 'winning') {
          setUploadError({ ...uploadError, winning: errorMsg })
        } else {
          setUploadError({ ...uploadError, losing: errorMsg })
        }
      }
    } catch (error) {
      const errorMsg = 'Error uploading image: ' + (error.message || 'Please try again.')
      if (type === 'winning') {
        setUploadError({ ...uploadError, winning: errorMsg })
      } else {
        setUploadError({ ...uploadError, losing: errorMsg })
      }
    } finally {
      if (type === 'winning') {
        setUploadingWinning(false)
      } else {
        setUploadingLosing(false)
      }
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, type)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="brutal-section w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-6 border-black p-6 flex items-center justify-between">
          <h2 className="brutal-title text-2xl">PROFILE</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Display Name */}
          <div className="border-2 border-black p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="brutal-label">DISPLAY NAME</p>
              {!isEditingDisplayName && (
                <button
                  onClick={() => setIsEditingDisplayName(true)}
                  className="text-xs font-bold hover:underline"
                >
                  [EDIT]
                </button>
              )}
            </div>
            {isEditingDisplayName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={displayNameValue}
                  onChange={(e) => setDisplayNameValue(e.target.value)}
                  className="brutal-input"
                  placeholder="ENTER DISPLAY NAME"
                  disabled={savingDisplayName}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={savingDisplayName || !displayNameValue.trim()}
                    className="brutal-btn text-sm py-2"
                  >
                    {savingDisplayName ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button
                    onClick={() => setIsEditingDisplayName(false)}
                    disabled={savingDisplayName}
                    className="brutal-btn brutal-btn-secondary text-sm py-2"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg font-bold">{getUserDisplayName()}</p>
            )}
          </div>

          {/* Email */}
          {currentUser?.email && (
            <div className="border-2 border-black p-4">
              <p className="brutal-label">EMAIL</p>
              <p className="font-bold">{currentUser.email}</p>
            </div>
          )}

          {/* Username */}
          {userProfile?.username && (
            <div className="border-2 border-black p-4">
              <p className="brutal-label">USERNAME</p>
              <p className="font-bold">@{userProfile.username}</p>
            </div>
          )}

          {/* Account Created */}
          {userProfile?.createdAt && (
            <div className="border-2 border-black p-4">
              <p className="brutal-label">ACCOUNT CREATED</p>
              <p className="font-bold">{formatDate(userProfile.createdAt)}</p>
            </div>
          )}

          {/* PNL Card Backgrounds */}
          <div className="border-2 border-black p-4">
            <h3 className="brutal-label mb-4">PNL CARD BACKGROUNDS</h3>
            <p className="text-xs text-gray-600 mb-4 uppercase">
              UPLOAD CUSTOM BACKGROUNDS FOR YOUR SHAREABLE PNL CARDS (800×1000PX RECOMMENDED)
            </p>

            <div className="space-y-4">
              {/* Winning */}
              <div className="border-2 border-green-700 p-4">
                <label className="brutal-label text-profit mb-2">WINNING TRADE</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'winning')}
                      className="hidden"
                      id="winning-upload"
                      disabled={uploadingWinning}
                    />
                    <label
                      htmlFor="winning-upload"
                      className={`brutal-btn block text-center w-full text-sm py-2 ${uploadingWinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {uploadingWinning ? `UPLOADING ${Math.round(uploadProgress.winning)}%` : 'UPLOAD'}
                    </label>
                    {uploadError.winning && (
                      <p className="mt-2 text-xs text-loss uppercase">{uploadError.winning}</p>
                    )}
                  </div>
                  {(previewWinning || userProfile?.winningTradeBackground) && (
                    <div className="w-16 h-20 border-2 border-black overflow-hidden">
                      <img
                        src={previewWinning || userProfile.winningTradeBackground}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Losing */}
              <div className="border-2 border-red-700 p-4">
                <label className="brutal-label text-loss mb-2">LOSING TRADE</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'losing')}
                      className="hidden"
                      id="losing-upload"
                      disabled={uploadingLosing}
                    />
                    <label
                      htmlFor="losing-upload"
                      className={`brutal-btn block text-center w-full text-sm py-2 ${uploadingLosing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {uploadingLosing ? `UPLOADING ${Math.round(uploadProgress.losing)}%` : 'UPLOAD'}
                    </label>
                    {uploadError.losing && (
                      <p className="mt-2 text-xs text-loss uppercase">{uploadError.losing}</p>
                    )}
                  </div>
                  {(previewLosing || userProfile?.losingTradeBackground) && (
                    <div className="w-16 h-20 border-2 border-black overflow-hidden">
                      <img
                        src={previewLosing || userProfile.losingTradeBackground}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="border-2 border-black p-4">
            <p className="brutal-label">USER ID</p>
            <p className="text-xs font-mono break-all">{currentUser?.uid}</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="border-t-6 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 font-bold uppercase hover:bg-black hover:text-white transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
