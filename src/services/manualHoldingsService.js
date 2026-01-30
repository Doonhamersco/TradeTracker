import { db } from '../firebase/config'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

const COLLECTION_NAME = 'manualHoldings'

/**
 * Add a new manual holding
 */
export const addManualHolding = async (holdingData, userId) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...holdingData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error adding manual holding:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing manual holding
 */
export const updateManualHolding = async (holdingId, holdingData) => {
  try {
    const holdingRef = doc(db, COLLECTION_NAME, holdingId)
    await updateDoc(holdingRef, {
      ...holdingData,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating manual holding:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a manual holding
 */
export const deleteManualHolding = async (holdingId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, holdingId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting manual holding:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to user's manual holdings (real-time)
 */
export const subscribeToManualHoldings = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  )

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const holdings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback({ success: true, holdings })
    },
    (error) => {
      console.error('Error subscribing to manual holdings:', error)
      callback({ success: false, error: error.message, holdings: [] })
    }
  )

  return unsubscribe
}

