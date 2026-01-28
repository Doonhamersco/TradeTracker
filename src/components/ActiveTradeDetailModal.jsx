import { useState } from 'react'
import { X, ExternalLink, Send, Edit2, Trash2, RefreshCw } from 'lucide-react'
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

  // Calculations
  const unrealizedPnL = calculateUnrealizedPnL(trade.entryPrice, trade.currentPrice, trade.positionSize)
  const unrealizedPnLPercent = calculateUnrealizedPnLPercent(trade.entryPrice, trade.currentPrice)
  const riskReward = calculateRiskReward(trade.entryPrice, trade.targetPrice, trade.stopLoss)
  const isProfit = unrealizedPnL >= 0

  // Sort comments newest first
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
    })
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

  const categoryColors = {
    'Fibonacci': 'bg-purple-600 text-purple-100',
    'Degen': 'bg-orange-600 text-orange-100',
    'Conviction': 'bg-blue-600 text-blue-100'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-white">{trade.assetName}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[trade.category] || 'bg-gray-600'}`}>
              {trade.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Levels Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Entry Price</p>
              <p className="text-xl font-bold text-white">{formatPrice(trade.entryPrice)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Current Price</p>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPrice(trade.currentPrice)}
                </p>
                <button
                  onClick={() => setShowPriceUpdate(!showPriceUpdate)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Update price"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Target Price</p>
              <p className="text-xl font-bold text-green-400">{formatPrice(trade.targetPrice)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Stop Loss</p>
              <p className="text-xl font-bold text-red-400">{formatPrice(trade.stopLoss)}</p>
            </div>
          </div>

          {/* Price Update Input */}
          {showPriceUpdate && (
            <div className="flex gap-2 p-4 bg-gray-800 rounded-lg">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="New current price"
                step="any"
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handlePriceUpdate}
                disabled={updatingPrice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {updatingPrice ? 'Updating...' : 'Update Price'}
              </button>
              <button
                onClick={() => setShowPriceUpdate(false)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Position Size</p>
              <p className="text-lg font-bold text-white">{formatCurrency(trade.positionSize)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Risk/Reward</p>
              <p className={`text-lg font-bold ${riskReward >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                R:R {riskReward.toFixed(2)}:1
              </p>
            </div>
            <div className={`rounded-lg p-4 ${isProfit ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="text-gray-400 text-sm mb-1">Unrealized P&L</p>
              <p className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{formatCurrency(unrealizedPnL)}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${isProfit ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="text-gray-400 text-sm mb-1">P&L %</p>
              <p className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
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
              className="flex items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">View Chart</span>
              <span className="text-gray-500 text-sm truncate flex-1">{trade.chartLink}</span>
            </a>
          )}

          {/* Thesis - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900/20 border border-green-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Why This Can Win</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{trade.whyCanWin || trade.originalThesis || 'No thesis provided'}</p>
            </div>
            <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Why This Can Fail</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{trade.whyCanFail || 'No risks documented'}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Entered: {formatDate(trade.entryDate)}
          </p>

          {/* Comments Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Comments ({trade.comments?.length || 0})
            </h3>
            
            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={2}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            {sortedComments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sortedComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-900 rounded-lg p-3">
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={submitting}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300">{comment.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            {formatDate(comment.timestamp)}
                            {comment.priceAtComment && (
                              <span className="ml-2">@ {formatPrice(comment.priceAtComment)}</span>
                            )}
                            {comment.edited && <span className="ml-2">(edited)</span>}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingText(comment.text)
                              }}
                              className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              <Edit2 className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-gray-500" />
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
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Price Update History</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...trade.priceHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-400">{entry.note}</span>
                    <span className="text-white">{formatPrice(entry.price)}</span>
                    <span className="text-gray-500">{formatDate(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClosePosition}
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close Position
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActiveTradeDetailModal

