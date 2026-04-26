'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PriceTrend } from '@/types'

interface Props {
  data: PriceTrend[]
  title?: string
}

function tooltipFormatter(value: number, name: string) {
  if (name === '평균 거래가') return [`${value.toLocaleString()}만원`, name]
  if (name === '거래량') return [value, name]
  if (name === '평균 m²당') return [`${value.toLocaleString()}만/m²`, name]
  return [value, name]
}

export default function PriceTrendChart({ data, title }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-64 text-slate-500">데이터 로딩 중…</div>
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
            width={38}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={v => `${v}건`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
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
