import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Set up real-time listener for user trades
export const subscribeToUserTrades = (userId, callback) => {
  console.log(`Setting up real-time listener for user: ${userId}`)
  
  const tradesRef = collection(db, 'trades')
  // Query without orderBy first (to avoid index requirements)
  // We'll sort manually in the callback
  const q = query(tradesRef, where('userId', '==', userId))
  
  return onSnapshot(q, 
    (querySnapshot) => {
      console.log(`onSnapshot fired. Document count: ${querySnapshot.size}`)
      const trades = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`Processing trade ${doc.id}:`, data)
        
        // Handle date conversion - serverTimestamp() creates a special object
        let dateISO = null
        if (data.date) {
          if (data.date.toDate && typeof data.date.toDate === 'function') {
            // Firestore Timestamp
            dateISO = data.date.toDate().toISOString()
          } else if (data.date instanceof Date) {
            // Already a Date object
            dateISO = data.date.toISOString()
          } else if (typeof data.date === 'string') {
            // Already a string
            dateISO = data.date
          }
        }
        
        trades.push({
          id: doc.id,
          ...data,
          date: dateISO
        })
      })
      
      // Sort by date descending manually
      trades.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      
      console.log(`Fetched ${trades.length} trades for user: ${userId}`, trades)
      callback({ success: true, trades })
    },
    (error) => {
      console.error('Error in trades listener:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      callback({ success: false, error: error.message })
    }
  )
}

// Add a new trade
export const addTrade = async (tradeData, userId) => {
  try {
    console.log(`Trade saved to Firestore with userId: ${userId}`)
    const tradesRef = collection(db, 'trades')
    
    // Handle date - convert ISO string to Firestore Timestamp if provided, otherwise use serverTimestamp
    let dateValue = serverTimestamp() // Default to server timestamp
    if (tradeData.date) {
      try {
        const dateObj = new Date(tradeData.date)
        if (!isNaN(dateObj.getTime())) {
          dateValue = Timestamp.fromDate(dateObj)
        }
      } catch (error) {
        console.warn('Error parsing date, using serverTimestamp:', error)
      }
    }
    
    const { date, ...restTradeData } = tradeData
    
    const tradeWithUserId = {
      ...restTradeData,
      userId,
      date: dateValue
    }
    
    const docRef = await addDoc(tradesRef, tradeWithUserId)
    console.log(`Trade successfully saved with ID: ${docRef.id}`)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error adding trade:', error)
    return { success: false, error: error.message }
  }
}

// Update an existing trade
export const updateTrade = async (tradeId, tradeData, userId) => {
  try {
    console.log(`Updating trade ${tradeId} for user: ${userId}`)
    const tradeRef = doc(db, 'trades', tradeId)
    
    // Handle date - convert ISO string to Firestore Timestamp if provided
    let dateValue = null
    if (tradeData.date) {
      try {
        const dateObj = new Date(tradeData.date)
        if (!isNaN(dateObj.getTime())) {
          dateValue = Timestamp.fromDate(dateObj)
        }
      } catch (error) {
        console.warn('Error parsing date:', error)
      }
    }
    
    const { date, ...restTradeData } = tradeData
    
    const tradeWithUserId = {
      ...restTradeData,
      userId,
    }
    
    // Only include date if it was provided and valid
    if (dateValue) {
      tradeWithUserId.date = dateValue
    }
    
    await updateDoc(tradeRef, tradeWithUserId)
    console.log(`Trade ${tradeId} successfully updated`)
    return { success: true }
  } catch (error) {
    console.error('Error updating trade:', error)
    return { success: false, error: error.message }
  }
}

// Delete a trade
export const deleteTrade = async (tradeId) => {
  try {
    const tradeRef = doc(db, 'trades', tradeId)
    await deleteDoc(tradeRef)
    return { success: true }
  } catch (error) {
    console.error('Error deleting trade:', error)
    return { success: false, error: error.message }
  }
}

// Helper to convert Firestore Timestamp to ISO string
export const convertTimestampToISO = (timestamp) => {
  if (!timestamp) return null
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString()
  }
  return timestamp
}

// Helper to convert trade from Firestore format
export const convertTradeFromFirestore = (trade) => {
  return {
    ...trade,
    date: convertTimestampToISO(trade.date)
  }
}

