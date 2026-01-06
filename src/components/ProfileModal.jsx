import { useState, useEffect } from 'react'
import { X, Mail, User as UserIcon, Calendar, Upload, Image as ImageIcon, Check, Edit2, Save, Info } from 'lucide-react'
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

  // Initialize display name value when modal opens or userProfile changes
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
    return 'User'
  }

  const handleEditDisplayName = () => {
    setIsEditingDisplayName(true)
    setDisplayNameValue(getUserDisplayName())
  }

  const handleCancelEditDisplayName = () => {
    setIsEditingDisplayName(false)
    setDisplayNameValue(getUserDisplayName())
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
        console.log('Display name updated successfully')
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return 'N/A'
    }
  }

  const handleImageUpload = async (file, type) => {
    if (!file || !currentUser?.uid) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Clear previous errors
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
      // Upload image to Firebase Storage with progress tracking
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
        console.log('Upload successful, updating profile...')
        
        // Update user profile with image URL
        const updateData = {}
        if (type === 'winning') {
          updateData.winningTradeBackground = result.url
        } else {
          updateData.losingTradeBackground = result.url
        }

        const updateResult = await updateUserProfile(currentUser.uid, updateData)
        
        if (updateResult.success) {
          console.log('Profile updated successfully')
          
          // Show preview
          const reader = new FileReader()
          reader.onload = (e) => {
            if (type === 'winning') {
              setPreviewWinning(e.target.result)
            } else {
              setPreviewLosing(e.target.result)
            }
          }
          reader.readAsDataURL(file)
          
          // Reset progress
          if (type === 'winning') {
            setUploadProgress({ ...uploadProgress, winning: 100 })
          } else {
            setUploadProgress({ ...uploadProgress, losing: 100 })
          }
        } else {
          const errorMsg = 'Error updating profile: ' + (updateResult.error || 'Unknown error')
          console.error(errorMsg)
          if (type === 'winning') {
            setUploadError({ ...uploadError, winning: errorMsg })
          } else {
            setUploadError({ ...uploadError, losing: errorMsg })
          }
        }
      } else {
        const errorMsg = 'Error uploading image: ' + (result.error || 'Unknown error')
        console.error(errorMsg, result)
        if (type === 'winning') {
          setUploadError({ ...uploadError, winning: errorMsg })
        } else {
          setUploadError({ ...uploadError, losing: errorMsg })
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profile ⚙️</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="space-y-4">
          {/* Display Name */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-400">Display Name</p>
              </div>
              {!isEditingDisplayName && (
                <button
                  onClick={handleEditDisplayName}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit display name"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
            {isEditingDisplayName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={displayNameValue}
                  onChange={(e) => setDisplayNameValue(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter display name"
                  disabled={savingDisplayName}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={savingDisplayName || !displayNameValue.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {savingDisplayName ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEditDisplayName}
                    disabled={savingDisplayName}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg font-semibold text-white">{getUserDisplayName()}</p>
            )}
          </div>

          {/* Email */}
          {currentUser?.email && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-400">Email</p>
              </div>
              <p className="text-lg font-semibold text-white">{currentUser.email}</p>
            </div>
          )}

          {/* Username */}
          {userProfile?.username && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-400">Username</p>
              </div>
              <p className="text-lg font-semibold text-white">{userProfile.username}</p>
            </div>
          )}

          {/* Account Created */}
          {userProfile?.createdAt && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-400">Account Created</p>
              </div>
              <p className="text-lg font-semibold text-white">{formatDate(userProfile.createdAt)}</p>
            </div>
          )}

          {/* PNL Card Backgrounds Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              PNL Card Backgrounds
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-sm text-gray-300">
                  <p className="mb-2">Paste the following prompt into your AI agent:</p>
                  <p className="text-white font-medium mb-2">"Use this character to create a PNL card like the example provided"</p>
                  <p className="text-xs text-gray-400">Alongside your profile picture and an example PNL card</p>
                  {/* Arrow pointing down */}
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"></div>
                </div>
              </div>
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Upload custom backgrounds for your shareable PNL cards. Images should be in 4:5 aspect ratio (recommended: 800x1000px).
            </p>

            <div className="space-y-4">
              {/* Winning Trade Background */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Winning Trade Background
                </label>
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
                      className={`flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors cursor-pointer ${
                        uploadingWinning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingWinning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading... {Math.round(uploadProgress.winning)}%</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{userProfile?.winningTradeBackground ? 'Change' : 'Upload'}</span>
                        </>
                      )}
                    </label>
                    {uploadProgress.winning > 0 && uploadProgress.winning < 100 && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.winning}%` }}
                        ></div>
                      </div>
                    )}
                    {uploadError.winning && (
                      <p className="mt-2 text-sm text-red-400">{uploadError.winning}</p>
                    )}
                  </div>
                  {(previewWinning || userProfile?.winningTradeBackground) && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={previewWinning || userProfile.winningTradeBackground}
                        alt="Winning background preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading preview image')
                          e.target.style.display = 'none'
                        }}
                      />
                      {userProfile?.winningTradeBackground && !previewWinning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Check className="w-6 h-6 text-green-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Losing Trade Background */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Losing Trade Background
                </label>
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
                      className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer ${
                        uploadingLosing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingLosing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading... {Math.round(uploadProgress.losing)}%</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{userProfile?.losingTradeBackground ? 'Change' : 'Upload'}</span>
                        </>
                      )}
                    </label>
                    {uploadProgress.losing > 0 && uploadProgress.losing < 100 && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.losing}%` }}
                        ></div>
                      </div>
                    )}
                    {uploadError.losing && (
                      <p className="mt-2 text-sm text-red-400">{uploadError.losing}</p>
                    )}
                  </div>
                  {(previewLosing || userProfile?.losingTradeBackground) && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={previewLosing || userProfile.losingTradeBackground}
                        alt="Losing background preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading preview image')
                          e.target.style.display = 'none'
                        }}
                      />
                      {userProfile?.losingTradeBackground && !previewLosing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Check className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-400">User ID</p>
            </div>
            <p className="text-xs font-mono text-gray-300 break-all">{currentUser?.uid}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default ProfileModal
