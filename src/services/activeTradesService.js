import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION_NAME = 'activeTrades'

// Subscribe to user's active trades (real-time listener)
export const subscribeToActiveTrades = (userId, callback) => {
  if (!userId) {
    callback({ success: false, error: 'No user ID provided' })
    return () => {}
  }

  // Simple query - filter status client-side to avoid composite index requirement
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  )

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const allTrades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Filter for active trades and sort by date client-side
      const activeTrades = allTrades
        .filter(trade => trade.status === 'active')
        .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
      
      callback({ success: true, trades: activeTrades })
    },
    (error) => {
      console.error('Error fetching active trades:', error)
      callback({ success: false, error: error.message })
    }
  )

  return unsubscribe
}

// Add a new active trade
export const addActiveTrade = async (tradeData, userId) => {
  try {
    console.log('Adding active trade for user:', userId)
    console.log('Trade data:', tradeData)
    
    const docData = {
      ...tradeData,
      userId,
      status: 'active',
      currentPrice: tradeData.entryPrice, // Initialize current price to entry
      comments: [],
      priceHistory: [{
        price: tradeData.entryPrice,
        timestamp: new Date().toISOString(),
        note: 'Entry price'
      }],
      createdAt: serverTimestamp()
    }
    
    console.log('Document to save:', docData)
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData)
    console.log('Trade added successfully with ID:', docRef.id)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error adding active trade:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    return { success: false, error: error.message }
  }
}

// Update current price
export const updateCurrentPrice = async (tradeId, newPrice, userId) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    await updateDoc(tradeRef, {
      currentPrice: newPrice,
      priceHistory: arrayUnion({
        price: newPrice,
        timestamp: new Date().toISOString(),
        note: 'Price update'
      }),
      lastUpdated: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating price:', error)
    return { success: false, error: error.message }
  }
}

// Add a comment to a trade
export const addComment = async (tradeId, commentText, currentPrice = null) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    const comment = {
      id: Date.now().toString(),
      text: commentText,
      timestamp: new Date().toISOString(),
      priceAtComment: currentPrice
    }
    await updateDoc(tradeRef, {
      comments: arrayUnion(comment)
    })
    return { success: true, comment }
  } catch (error) {
    console.error('Error adding comment:', error)
    return { success: false, error: error.message }
  }
}

// Update a comment (need to replace entire comments array)
export const updateComment = async (tradeId, commentId, newText, allComments) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    const updatedComments = allComments.map(c => 
      c.id === commentId ? { ...c, text: newText, edited: true } : c
    )
    await updateDoc(tradeRef, {
      comments: updatedComments
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating comment:', error)
    return { success: false, error: error.message }
  }
}

// Delete a comment
export const deleteComment = async (tradeId, commentId, allComments) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    const updatedComments = allComments.filter(c => c.id !== commentId)
    await updateDoc(tradeRef, {
      comments: updatedComments
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { success: false, error: error.message }
  }
}

// Close a position
export const closePosition = async (tradeId, exitPrice, exitDate) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    await updateDoc(tradeRef, {
      status: 'closed',
      exitPrice,
      exitDate,
      closedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error closing position:', error)
    return { success: false, error: error.message }
  }
}

// Update active trade details
export const updateActiveTrade = async (tradeId, updates) => {
  try {
    const tradeRef = doc(db, COLLECTION_NAME, tradeId)
    await updateDoc(tradeRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating active trade:', error)
    return { success: false, error: error.message }
  }
}

// Delete an active trade
export const deleteActiveTrade = async (tradeId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, tradeId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting active trade:', error)
    return { success: false, error: error.message }
  }
}

// Calculate Risk/Reward Ratio
export const calculateRiskReward = (entryPrice, targetPrice, stopLoss) => {
  const reward = targetPrice - entryPrice
  const risk = entryPrice - stopLoss
  if (risk <= 0) return 0
  return reward / risk
}

// Calculate Unrealized P&L (USD)
export const calculateUnrealizedPnL = (entryPrice, currentPrice, positionSize) => {
  return ((currentPrice - entryPrice) / entryPrice) * positionSize
}

// Calculate Unrealized P&L (%)
export const calculateUnrealizedPnLPercent = (entryPrice, currentPrice) => {
  return ((currentPrice - entryPrice) / entryPrice) * 100
}

// Calculate Exit Size when closing
export const calculateExitSize = (entryPrice, exitPrice, positionSize) => {
  return positionSize * (1 + (exitPrice - entryPrice) / entryPrice)
}

