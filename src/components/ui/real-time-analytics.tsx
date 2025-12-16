"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface DataPoint {
  time: number
  value: number
  label?: string
}

interface RealTimeAnalyticsProps {
  data?: DataPoint[]
  title?: string
  subtitle?: string
  unit?: string
  className?: string
  height?: number
  animated?: boolean
}

export function RealTimeAnalytics({
  data: externalData,
  title = "Atividade em Tempo Real",
  subtitle = "Métricas de desempenho",
  unit = "",
  className = "",
  height = 250,
  animated = true,
}: RealTimeAnalyticsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const data = externalData || []
  const width = 800
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }

  const maxValue = Math.max(...data.map(d => d.value), 10)
  const minValue = Math.min(...data.map(d => d.value), 0)
  const range = maxValue - minValue || 1

  const getX = (index: number) => {
    if (data.length < 2) return padding.left
    return padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right)
  }

  const getY = (value: number) => {
    return padding.top + (1 - (value - minValue) / range) * (height - padding.top - padding.bottom)
  }

  const getPath = () => {
    if (data.length < 2) return ""
    return data
      .map((point, i) => {
        const x = getX(i)
        const y = getY(point.value)
        return `${i === 0 ? "M" : "L"} ${x},${y}`
      })
      .join(" ")
  }

  const getAreaPath = () => {
    if (data.length < 2) return ""
    const linePath = getPath()
    const lastX = getX(data.length - 1)
    const firstX = getX(0)
    const bottomY = height - padding.bottom
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current || data.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const scaleX = width / rect.width

    // Find closest point
    let closest: DataPoint | null = null
    let closestIndex = 0
    let minDist = Number.POSITIVE_INFINITY
    data.forEach((point, index) => {
      const px = getX(index) / scaleX
      const dist = Math.abs(px - x)
      if (dist < minDist && dist < 50) {
        minDist = dist
        closest = point
        closestIndex = index
      }
    })
    setHoveredPoint(closest)
  }

  const currentValue = data[data.length - 1]?.value || 0

  // Grid lines values
  const gridValues = [minValue, minValue + range * 0.25, minValue + range * 0.5, minValue + range * 0.75, maxValue]

  return (
    <div className={`${className}`}>
      <style>{`
        @keyframes flowGradient {
          0% { stop-color: hsl(var(--primary)); }
          50% { stop-color: hsl(221, 83%, 65%); }
          100% { stop-color: hsl(var(--primary)); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; r: 6; }
          50% { opacity: 0.7; r: 8; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .flowing-line {
          stroke-dasharray: 1000;
          animation: drawLine 2s ease-out forwards;
        }
        .data-dot {
          animation: pulse 2s ease-in-out infinite;
        }
        .glow {
          filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.6));
        }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-display text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-xl border border-border">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-muted-foreground text-sm">Ao vivo</span>
          <span className="text-foreground text-xl font-bold ml-2">
            {currentValue.toFixed(0)}{unit}
          </span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="lineGradientAnalytics" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))">
                {animated && (
                  <animate
                    attributeName="stop-color"
                    values="hsl(221, 83%, 53%);hsl(221, 83%, 65%);hsl(221, 83%, 53%)"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                )}
              </stop>
              <stop offset="50%" stopColor="hsl(221, 83%, 60%)">
                {animated && (
                  <animate
                    attributeName="stop-color"
                    values="hsl(221, 83%, 60%);hsl(221, 83%, 70%);hsl(221, 83%, 60%)"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                )}
              </stop>
              <stop offset="100%" stopColor="hsl(221, 83%, 65%)">
                {animated && (
                  <animate
                    attributeName="stop-color"
                    values="hsl(221, 83%, 65%);hsl(221, 83%, 53%);hsl(221, 83%, 65%)"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                )}
              </stop>
            </linearGradient>
            <linearGradient id="areaGradientAnalytics" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridValues.map((val, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(val)}
                x2={width - padding.right}
                y2={getY(val)}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={getY(val)}
                fill="hsl(var(--muted-foreground))"
                fontSize="12"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {val.toFixed(0)}{unit}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={getAreaPath()} fill="url(#areaGradientAnalytics)" />

          {/* Main line */}
          <path
            className={animated ? "flowing-line glow" : "glow"}
            d={getPath()}
            fill="none"
            stroke="url(#lineGradientAnalytics)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, i) => (
            <circle
              key={i}
              className={i === data.length - 1 && animated ? "data-dot" : ""}
              cx={getX(i)}
              cy={getY(point.value)}
              r={i === data.length - 1 ? 6 : 3}
              fill={i === data.length - 1 ? "hsl(221, 83%, 65%)" : "hsl(var(--primary))"}
              style={{
                opacity: hoveredPoint?.time === point.time ? 1 : 0.7,
                transition: "opacity 0.2s ease",
              }}
            />
          ))}

          {/* Hover crosshair */}
          {hoveredPoint && (
            <>
              <line
                x1={getX(data.findIndex(d => d.time === hoveredPoint.time))}
                y1={padding.top}
                x2={getX(data.findIndex(d => d.time === hoveredPoint.time))}
                y2={height - padding.bottom}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle
                cx={getX(data.findIndex(d => d.time === hoveredPoint.time))}
                cy={getY(hoveredPoint.value)}
                r="8"
                fill="none"
                stroke="hsl(221, 83%, 65%)"
                strokeWidth="2"
              />
            </>
          )}

          {/* X-axis labels */}
          {data.map((point, i) => {
            if (i % Math.ceil(data.length / 7) !== 0 && i !== data.length - 1) return null
            return (
              <text
                key={`label-${i}`}
                x={getX(i)}
                y={height - 10}
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
                textAnchor="middle"
              >
                {point.label || ''}
              </text>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-card border border-primary rounded-lg px-3 py-2 pointer-events-none z-10 shadow-lg"
            style={{
              left: `${(getX(data.findIndex(d => d.time === hoveredPoint.time)) / width) * 100}%`,
              top: `${(getY(hoveredPoint.value) / height) * 100 - 15}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-foreground font-semibold text-sm">
              {hoveredPoint.value.toFixed(0)}{unit}
            </div>
            {hoveredPoint.label && (
              <div className="text-muted-foreground text-xs">
                {hoveredPoint.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {[
          {
            label: "Média",
            value: data.length > 0 ? (data.reduce((a, b) => a + b.value, 0) / data.length).toFixed(0) : "0",
          },
          { 
            label: "Máximo", 
            value: data.length > 0 ? Math.max(...data.map((d) => d.value)).toFixed(0) : "0" 
          },
          { 
            label: "Total", 
            value: data.length.toString() 
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-border p-3 text-center"
          >
            <div className="text-muted-foreground text-xs mb-1">{stat.label}</div>
            <div className="text-foreground text-lg font-semibold">
              {stat.value}{stat.label !== "Total" ? unit : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RealTimeAnalytics;
