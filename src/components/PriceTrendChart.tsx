'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { PriceTrend } from '@/types'

interface Props {
  data: PriceTrend[]
  title?: string
}

// Key policy / macro events shown as vertical markers on the chart.
// Month format matches the shortened 'YY-MM' used in formatted data.
const POLICY_EVENTS: { month: string; label: string; color: string }[] = [
  { month: '22-07', label: '금리인상 가속',   color: '#ef4444' },
  { month: '23-01', label: '특례보금자리론',  color: '#3b82f6' },
  { month: '24-09', label: '스트레스DSR 2단계', color: '#f59e0b' },
  { month: '25-02', label: '금리인하 사이클', color: '#10b981' },
]

function tooltipFormatter(value: number, name: string) {
  if (name === '평균 거래가') return [`${value.toLocaleString()}만원`, name]
  if (name === '거래량') return [value, name]
  if (name === '평균 m²당') return [`${value.toLocaleString()}만/m²`, name]
  return [value, name]
}

export default function PriceTrendChart({ data, title }: Props) {
  if (!data.length) return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>}
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <span className="text-3xl opacity-30">📊</span>
        <p className="text-slate-500 text-sm">이 구의 거래 데이터가 충분하지 않습니다</p>
        <p className="text-slate-600 text-xs">최근 6개월 이내 거래가 10건 미만인 지역은 추세를 표시하지 않습니다</p>
      </div>
    </div>
  )

  const formatted = data.map(d => ({
    ...d,
    month: d.month.slice(2), // shorten to YY-MM
  }))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>}
      <div className="overflow-x-auto"><div style={{ minWidth: 320 }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted} margin={{ top: 5, right: 4, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis
            yAxisId="price"
            orientation="left"
            width={44}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={v => `${(v / 10000).toFixed(0)}억`}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            width={36}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={v => `${Math.round(v / 1000)}천`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          {POLICY_EVENTS
            .filter(e => formatted.some(d => d.month === e.month))
            .map(e => (
              <ReferenceLine
                key={e.month}
                x={e.month}
                yAxisId="price"
                stroke={e.color}
                strokeDasharray="4 3"
                strokeOpacity={0.6}
                label={{ value: e.label, fill: e.color, fontSize: 9, position: 'insideTopLeft', angle: -90, dy: 4 }}
              />
            ))}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="avgPrice"
            name="평균 거래가"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="transactionCount"
            name="거래량"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div></div>
    </div>
  )
}
