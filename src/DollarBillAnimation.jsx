import { useEffect, useState } from 'react'

const DollarBillAnimation = ({ trigger }) => {
  const [bills, setBills] = useState([])

  useEffect(() => {
    if (trigger) {
      // Create multiple dollar bill emojis
      const newBills = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100, // Random horizontal position
        delay: Math.random() * 0.5, // Stagger the animation
        duration: 2 + Math.random() * 1, // 2-3 seconds
        rotation: Math.random() * 360,
      }))
      
      setBills(newBills)
      
      // Clear bills after animation completes
      const timer = setTimeout(() => {
        setBills([])
      }, 3500)
      
      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (bills.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="absolute text-4xl md:text-5xl animate-float-up"
          style={{
            left: `${bill.left}%`,
            animationDelay: `${bill.delay}s`,
            animationDuration: `${bill.duration}s`,
            transform: `rotate(${bill.rotation}deg)`,
          }}
        >
          💵
        </div>
      ))}
    </div>
  )
}

export default DollarBillAnimation

