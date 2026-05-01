'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import clsx from 'clsx'

const links = [
  { href: '/',              label: '대시보드' },
  { href: '/timing',        label: '매수 타이밍' },
  { href: '/reality',       label: '시장 현실' },
  { href: '/supply-demand', label: '공급·수요' },
  { href: '/policy',        label: '정책 분석' },
  { href: '/calculator',    label: '부담 계산기' },
]

export default function NavBar() {
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Top bar */}
        <div className="flex items-center h-14 gap-4">
          <Link
            href="/"
            className="font-bold text-blue-400 text-base tracking-tight shrink-0"
            onClick={() => setOpen(false)}
          >
            서울부동산 투명화
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <span className="ml-auto hidden md:block text-xs text-slate-500">
            데이터: 국토교통부 + 한국부동산원
          </span>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-100 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="메뉴"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden pb-3 space-y-0.5 border-t border-slate-800 pt-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-3 py-2.5 rounded text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800',
                )}
              >
                {l.label}
              </Link>
            ))}
            <p className="px-3 pt-2 text-xs text-slate-600">데이터: 국토교통부 + 한국부동산원</p>
          </div>
        )}
      </div>
    </nav>
  )
}
