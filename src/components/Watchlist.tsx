'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

export interface WatchlistItem {
  aptName: string
  gu: string
  addedAt: string  // ISO date string
}

const STORAGE_KEY = 'seoul-watchlist'

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const save = useCallback((next: WatchlistItem[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const add = useCallback((aptName: string, gu: string) => {
    setItems(prev => {
      if (prev.some(i => i.aptName === aptName && i.gu === gu)) return prev
      const next = [{ aptName, gu, addedAt: new Date().toISOString() }, ...prev].slice(0, 30)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const remove = useCallback((aptName: string, gu: string) => {
    save(items.filter(i => !(i.aptName === aptName && i.gu === gu)))
  }, [items, save])

  const isWatched = useCallback((aptName: string, gu: string) =>
    items.some(i => i.aptName === aptName && i.gu === gu)
  , [items])

  return { items, add, remove, isWatched }
}

interface WatchlistPanelProps {
  items: WatchlistItem[]
  onRemove: (aptName: string, gu: string) => void
}

export function WatchlistPanel({ items, onRemove }: WatchlistPanelProps) {
  const [open, setOpen] = useState(false)

  if (items.length === 0 && !open) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl text-sm font-semibold transition-all',
          'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500',
        )}
      >
        <span>★</span>
        <span>관심 단지 {items.length}</span>
        <span className="text-blue-300 text-xs">{open ? '▼' : '▲'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-12 right-0 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">관심 단지 목록</h3>
            <span className="text-xs text-slate-500">{items.length}개</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
            {items.map(item => (
              <div key={`${item.aptName}-${item.gu}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-700/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/complex?name=${encodeURIComponent(item.aptName)}&gu=${encodeURIComponent(item.gu)}`}
                    className="text-sm font-medium text-slate-200 hover:text-blue-300 transition-colors block truncate"
                    onClick={() => setOpen(false)}
                  >
                    {item.aptName}
                  </Link>
                  <p className="text-xs text-slate-500">{item.gu}</p>
                </div>
                <button
                  onClick={() => onRemove(item.aptName, item.gu)}
                  className="text-slate-600 hover:text-rose-400 transition-colors text-sm shrink-0 px-1"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-600">아파트 이름을 클릭하면 단지 상세 페이지로 이동합니다</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface WatchButtonProps {
  aptName: string
  gu: string
  isWatched: boolean
  onAdd: (aptName: string, gu: string) => void
  onRemove: (aptName: string, gu: string) => void
  size?: 'sm' | 'xs'
}

export function WatchButton({ aptName, gu, isWatched, onAdd, onRemove, size = 'sm' }: WatchButtonProps) {
  return (
    <button
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        isWatched ? onRemove(aptName, gu) : onAdd(aptName, gu)
      }}
      title={isWatched ? '관심 단지에서 제거' : '관심 단지에 추가'}
      className={clsx(
        'transition-colors shrink-0',
        size === 'xs' ? 'text-xs px-1' : 'text-sm px-1.5',
        isWatched ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-amber-400',
      )}
    >
      {isWatched ? '★' : '☆'}
    </button>
  )
}
