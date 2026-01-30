import { useState } from 'react'
import { 
  addComment, 
  deleteComment, 
  updateComment,
  updateCurrentPrice,
  calculateUnrealizedPnL, 
  calculateUnrealizedPnLPercent, 
  calculateRiskReward 
} from '../services/activeTradesService'

function ActiveTradeDetailModal({ trade, onClose, onClosePosition }) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [newPrice, setNewPrice] = useState(trade.currentPrice?.toString() || '')
  const [updatingPrice, setUpdatingPrice] = useState(false)

  const unrealizedPnL = calculateUnrealizedPnL(trade.entryPrice, trade.currentPrice, trade.positionSize)
  const unrealizedPnLPercent = calculateUnrealizedPnLPercent(trade.entryPrice, trade.currentPrice)
  const riskReward = calculateRiskReward(trade.entryPrice, trade.targetPrice, trade.stopLoss)
  const isProfit = unrealizedPnL >= 0

  const sortedComments = [...(trade.comments || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).toUpperCase()
  }

  const formatPrice = (value) => {
    if (value < 0.01) return `$${value.toFixed(6)}`
    if (value < 1) return `$${value.toFixed(4)}`
    return `$${value.toFixed(2)}`
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    setSubmitting(true)
    const result = await addComment(trade.id, newComment.trim(), trade.currentPrice)
    if (result.success) {
      setNewComment('')
    }
    setSubmitting(false)
  }

  const handleEditComment = async (commentId) => {
    if (!editingText.trim()) return
    
    setSubmitting(true)
    await updateComment(trade.id, commentId, editingText.trim(), trade.comments)
    setEditingCommentId(null)
    setEditingText('')
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    await deleteComment(trade.id, commentId, trade.comments)
  }

  const handlePriceUpdate = async () => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) return

    setUpdatingPrice(true)
    await updateCurrentPrice(trade.id, price, trade.userId)
    setUpdatingPrice(false)
    setShowPriceUpdate(false)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="brutal-section w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-6 border-black p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="brutal-title text-3xl">{trade.assetName}</h2>
            <span className="border-2 border-black px-3 py-1 text-xs font-bold uppercase">
              {trade.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Levels Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-black">
            <div className="p-4 border-r-2 border-b-2 md:border-b-0 border-black">
              <p className="brutal-label">ENTRY PRICE</p>
              <p className="text-xl font-bold font-mono">{formatPrice(trade.entryPrice)}</p>
            </div>
            <div className="p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <p className="brutal-label flex items-center gap-2">
                CURRENT PRICE
                <button
                  onClick={() => setShowPriceUpdate(!showPriceUpdate)}
                  className="text-xs hover:underline"
                >
                  [EDIT]
                </button>
              </p>
              <p className={`text-xl font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
                {formatPrice(trade.currentPrice)}
              </p>
            </div>
            <div className="p-4 border-r-2 border-black">
              <p className="brutal-label text-profit">TARGET</p>
              <p className="text-xl font-bold font-mono text-profit">{formatPrice(trade.targetPrice)}</p>
            </div>
            <div className="p-4">
              <p className="brutal-label text-loss">STOP LOSS</p>
              <p className="text-xl font-bold font-mono text-loss">{formatPrice(trade.stopLoss)}</p>
            </div>
          </div>

          {/* Price Update Input */}
          {showPriceUpdate && (
            <div className="p-4 border-2 border-black flex gap-2">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="NEW CURRENT PRICE"
                step="any"
                className="brutal-input flex-1"
                autoFocus
              />
              <button
                onClick={handlePriceUpdate}
                disabled={updatingPrice}
                className="brutal-btn"
              >
                {updatingPrice ? 'UPDATING...' : 'UPDATE'}
              </button>
              <button
                onClick={() => setShowPriceUpdate(false)}
                className="brutal-btn brutal-btn-secondary"
              >
                CANCEL
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-black">
            <div className="p-4 border-r-2 border-b-2 md:border-b-0 border-black">
              <p className="brutal-label">POSITION SIZE</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(trade.positionSize)}</p>
            </div>
            <div className="p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <p className="brutal-label">RISK/REWARD</p>
              <p className={`text-lg font-bold font-mono ${riskReward >= 2 ? 'text-profit' : ''}`}>
                R:R {riskReward.toFixed(2)}:1
              </p>
            </div>
            <div className={`p-4 border-r-2 border-black ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="brutal-label">UNREALIZED P&L</p>
              <p className={`text-lg font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
                {isProfit ? '+' : ''}{formatCurrency(unrealizedPnL)}
              </p>
            </div>
            <div className={`p-4 ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="brutal-label">P&L %</p>
              <p className={`text-lg font-bold font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
                {isProfit ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Chart Link */}
          {trade.chartLink && (
            <a
              href={trade.chartLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold uppercase text-sm"
            >
              ↗ VIEW CHART
            </a>
          )}

          {/* Thesis - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-green-700 p-4">
              <h3 className="brutal-label text-profit mb-2">WHY THIS CAN WIN</h3>
              <p className="text-sm whitespace-pre-wrap">{trade.whyCanWin || trade.originalThesis || 'No thesis provided'}</p>
            </div>
            <div className="border-2 border-red-700 p-4">
              <h3 className="brutal-label text-loss mb-2">WHY THIS CAN FAIL</h3>
              <p className="text-sm whitespace-pre-wrap">{trade.whyCanFail || 'No risks documented'}</p>
            </div>
          </div>
          
          <p className="text-xs font-bold uppercase text-gray-500">
            ENTERED: {formatDate(trade.entryDate)}
          </p>

          {/* Comments Section */}
          <div className="border-2 border-black p-4">
            <h3 className="brutal-label mb-4">
              COMMENTS ({trade.comments?.length || 0})
            </h3>
            
            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="ADD A COMMENT..."
                rows={2}
                className="brutal-input flex-1 resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
                className="brutal-btn self-end"
              >
                →
              </button>
            </div>

            {/* Comments List */}
            {sortedComments.length === 0 ? (
              <p className="text-center py-4 text-gray-500 uppercase text-sm">NO COMMENTS YET</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedComments.map((comment) => (
                  <div key={comment.id} className="border border-black p-3">
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="brutal-input flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={submitting}
                          className="brutal-btn text-xs py-2"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="brutal-btn brutal-btn-secondary text-xs py-2"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{comment.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs font-mono text-gray-500">
                            {formatDate(comment.timestamp)}
                            {comment.priceAtComment && (
                              <span className="ml-2">@ {formatPrice(comment.priceAtComment)}</span>
                            )}
                            {comment.edited && <span className="ml-2">(EDITED)</span>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingText(comment.text)
                              }}
                              className="text-xs font-bold hover:underline"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs font-bold text-loss hover:underline"
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price History */}
          {trade.priceHistory && trade.priceHistory.length > 1 && (
            <div className="border-2 border-black p-4">
              <h3 className="brutal-label mb-3">PRICE UPDATE HISTORY</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...trade.priceHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">{entry.note}</span>
                    <span className="font-bold">{formatPrice(entry.price)}</span>
                    <span className="text-gray-500">{formatDate(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 border-t-6 border-black">
          <button
            onClick={onClose}
            className="py-4 font-bold uppercase hover:bg-black hover:text-white transition-colors border-r-2 border-black"
          >
            CLOSE
          </button>
          <button
            onClick={onClosePosition}
            className="py-4 font-bold uppercase text-loss hover:bg-loss hover:text-white transition-colors"
          >
            CLOSE POSITION
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActiveTradeDetailModal
