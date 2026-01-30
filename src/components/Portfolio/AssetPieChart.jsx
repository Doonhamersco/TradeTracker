import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'

// Color palette for assets
const COLORS = [
  '#000000', // Black
  '#166534', // Green (profit)
  '#991B1B', // Red (loss)
  '#0284C7', // Blue
  '#CA8A04', // Yellow/Gold
  '#7C3AED', // Purple
  '#666666', // Gray
  '#DC2626', // Bright red
  '#059669', // Teal
  '#EA580C', // Orange
]

const CATEGORY_COLORS = {
  'Fibonacci': '#000000',
  'Degen': '#991B1B',
  'Conviction': '#166534',
}

// Custom active shape for hover state
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props

  return (
    <g>
      {/* Highlighted segment */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#000000"
        strokeWidth={3}
      />
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" className="font-bold text-xl uppercase">
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" className="font-mono text-lg">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  )
}

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border-2 border-black p-3 shadow-lg">
        <p className="font-bold uppercase text-lg">{data.name}</p>
        <p className="font-mono">
          ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="font-mono text-sm text-gray-600">
          {data.percentage?.toFixed(1) || ((data.value / data.totalValue) * 100).toFixed(1)}%
        </p>
        {data.quantity && (
          <p className="text-xs text-gray-500 uppercase mt-1">
            {data.quantity.toFixed(4)} @ ${data.currentPrice?.toFixed(2)}
          </p>
        )}
      </div>
    )
  }
  return null
}

function AssetPieChart({ data, view, totalValue }) {
  const [activeIndex, setActiveIndex] = useState(null)

  // Group data by category if in category view
  const chartData = view === 'category' 
    ? Object.entries(
        data.reduce((acc, item) => {
          const cat = item.category || 'Unknown'
          if (!acc[cat]) acc[cat] = 0
          acc[cat] += item.value
          return acc
        }, {})
      ).map(([name, value]) => ({
        name,
        value,
        totalValue,
        color: CATEGORY_COLORS[name] || '#666666'
      }))
    : data.map((item, index) => ({
        name: item.coin,
        value: item.value,
        quantity: item.quantity,
        currentPrice: item.currentPrice,
        percentage: item.percentage,
        totalValue,
        color: COLORS[index % COLORS.length]
      }))

  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  // Format currency for center display
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-black">
        <p className="font-bold uppercase text-gray-500">NO DATA</p>
      </div>
    )
  }

  return (
    <div>
      {/* Chart container with center label */}
      <div className="relative" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              stroke="#FFFFFF"
              strokeWidth={3}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total (when no segment is active) */}
        {activeIndex === null && (
          <div 
            className="absolute pointer-events-none"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase text-gray-500">TOTAL</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 border-t-2 border-black pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chartData.map((entry, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 p-2 border border-black cursor-pointer transition-colors ${
                activeIndex === index ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div 
                className="w-4 h-4 flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm uppercase truncate ${activeIndex === index ? 'text-white' : ''}`}>
                  {entry.name}
                </p>
                <p className={`font-mono text-xs ${activeIndex === index ? 'text-gray-300' : 'text-gray-600'}`}>
                  {((entry.value / totalValue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssetPieChart

