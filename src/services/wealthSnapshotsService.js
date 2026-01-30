import { db } from '../firebase/config'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

const COLLECTION_NAME = 'wealthSnapshots'

/**
 * Calculate net worth and changes from snapshot data
 */
export const calculateSnapshotValues = (snapshotData, previousSnapshot = null) => {
  const { assets, debts, exchangeRate } = snapshotData
  
  // Convert crypto USD to GBP
  const cryptoGBP = assets.cryptoUSD / exchangeRate.GBPUSD
  
  // Total assets in GBP
  const totalAssetsGBP = (assets.bankGBP || 0) + 
                         (assets.hargreavesGBP || 0) + 
                         cryptoGBP
  
  // Total debts in GBP
  const totalDebtsGBP = debts.studentLoanGBP || 0
  
  // Net worth
  const netWorthGBP = totalAssetsGBP - totalDebtsGBP
  
  // Calculate change from previous snapshot
  let changeGBP = null
  let changePercent = null
  let previousSnapshotId = null
  
  if (previousSnapshot && previousSnapshot.calculated) {
    previousSnapshotId = previousSnapshot.id
    const prevNetWorth = previousSnapshot.calculated.netWorthGBP
    changeGBP = netWorthGBP - prevNetWorth
    changePercent = prevNetWorth !== 0 ? (changeGBP / prevNetWorth) * 100 : 0
  }
  
  return {
    cryptoGBP,
    totalAssetsGBP,
    totalDebtsGBP,
    netWorthGBP,
    previousSnapshotId,
    changeGBP,
    changePercent
  }
}

/**
 * Add a new wealth snapshot
 */
export const addWealthSnapshot = async (snapshotData, userId) => {
  try {
    // Get the previous snapshot to calculate change
    const previousSnapshot = await getLatestSnapshot(userId)
    
    // Calculate derived values
    const calculated = calculateSnapshotValues(snapshotData, previousSnapshot)
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...snapshotData,
      userId,
      calculated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error adding wealth snapshot:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing wealth snapshot
 */
export const updateWealthSnapshot = async (snapshotId, snapshotData, userId) => {
  try {
    // Get the previous snapshot (before this one by date)
    const previousSnapshot = await getPreviousSnapshot(userId, snapshotData.date)
    
    // Recalculate derived values
    const calculated = calculateSnapshotValues(snapshotData, previousSnapshot)
    
    const snapshotRef = doc(db, COLLECTION_NAME, snapshotId)
    await updateDoc(snapshotRef, {
      ...snapshotData,
      calculated,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error updating wealth snapshot:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a wealth snapshot
 */
export const deleteWealthSnapshot = async (snapshotId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, snapshotId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting wealth snapshot:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get the latest snapshot for a user
 */
export const getLatestSnapshot = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error('Error getting latest snapshot:', error)
    return null
  }
}

/**
 * Get the snapshot before a given date
 */
export const getPreviousSnapshot = async (userId, date) => {
  try {
    const timestamp = new Date(date).getTime()
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('timestamp', '<', timestamp),
      orderBy('timestamp', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error('Error getting previous snapshot:', error)
    return null
  }
}

/**
 * Subscribe to user's wealth snapshots (real-time)
 */
export const subscribeToWealthSnapshots = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  )

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const snapshots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback({ success: true, snapshots })
    },
    (error) => {
      console.error('Error subscribing to wealth snapshots:', error)
      callback({ success: false, error: error.message, snapshots: [] })
    }
  )

  return unsubscribe
}

/**
 * Get snapshots within a date range
 */
export const getSnapshotsInRange = async (userId, startDate, endDate) => {
  try {
    const startTimestamp = new Date(startDate).getTime()
    const endTimestamp = new Date(endDate).getTime()
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'asc')
    )
    
    const snapshot = await getDocs(q)
    
    return {
      success: true,
      snapshots: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (error) {
    console.error('Error getting snapshots in range:', error)
    return { success: false, error: error.message, snapshots: [] }
  }
}

/**
 * Check if a snapshot exists for a given date
 */
export const checkSnapshotExists = async (userId, date) => {
  try {
    const dateStr = date.split('T')[0] // Normalize to YYYY-MM-DD
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '==', dateStr),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return { exists: false, snapshot: null }
    }
    
    const doc = snapshot.docs[0]
    return { exists: true, snapshot: { id: doc.id, ...doc.data() } }
  } catch (error) {
    console.error('Error checking snapshot exists:', error)
    return { exists: false, snapshot: null, error: error.message }
  }
}

