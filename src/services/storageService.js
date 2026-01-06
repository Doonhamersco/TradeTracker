import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage'
import { storage } from '../firebase/config'

// Upload image to Firebase Storage with progress tracking
export const uploadImage = async (file, userId, imageType, onProgress) => {
  try {
    console.log('Starting upload:', { fileName: file.name, size: file.size, type: file.type, userId, imageType })
    
    // Create a reference to the file location
    const fileName = `${imageType}-${Date.now()}.${file.name.split('.').pop()}`
    const storageRef = ref(storage, `users/${userId}/pnl-backgrounds/${fileName}`)
    
    console.log('Storage ref created:', storageRef.fullPath)
    
    // Use uploadBytesResumable for progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file)
    
    // Set up progress tracking
    if (onProgress) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload progress:', progress + '%')
          onProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          throw error
        }
      )
    }
    
    // Wait for upload to complete
    const snapshot = await uploadTask
    
    console.log('Upload complete, getting download URL...')
    console.log('Upload snapshot:', snapshot)
    
    // Get the download URL - this might fail if rules don't allow read
    try {
      const downloadURL = await getDownloadURL(storageRef)
      console.log('Download URL obtained:', downloadURL)
      return { success: true, url: downloadURL, fileName }
    } catch (urlError) {
      console.error('Error getting download URL:', urlError)
      // If we can't get the URL due to rules, the file was still uploaded
      // Try to construct the URL manually or return the path
      if (urlError.code === 'storage/unauthorized') {
        throw new Error('Storage access denied. Please check Firebase Storage rules allow reading after upload.')
      }
      throw urlError
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    // Provide more helpful error messages
    let errorMessage = error.message
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Storage access denied. Please check Firebase Storage rules.'
    } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload was canceled.'
    } else if (error.code === 'storage/unknown') {
      errorMessage = 'Unknown storage error occurred.'
    }
    
    return { success: false, error: errorMessage, code: error.code }
  }
}

// Delete image from Firebase Storage
export const deleteImage = async (fileUrl) => {
  try {
    // Extract the file path from the URL
    const fileRef = ref(storage, fileUrl)
    await deleteObject(fileRef)
    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: error.message }
  }
}

