'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import clsx from 'clsx'

const mainLinks = [
  { href: '/',              label: '대시보드' },
  { href: '/timing',        label: '매수 타이밍' },
  { href: '/reality',       label: '시장 현실' },
  { href: '/supply-demand', label: '공급·수요' },
  { href: '/policy',        label: '정책 분석' },
]

const districtLinks = [
  { href: '/gangnam',   label: '강남구' },
  { href: '/seocho',    label: '서초구' },
  { href: '/yongsan',   label: '용산구' },
  { href: '/seongdong', label: '성동구' },
  { href: '/songpa',    label: '송파구' },
]

const links = [...mainLinks, ...districtLinks]

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
          <div className="hidden md:flex items-center gap-1">
            {mainLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={clsx(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
                )}>
                {l.label}
              </Link>
            ))}
            <span className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
            {districtLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={clsx(
                  'px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                  pathname === l.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800',
                )}>
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
          <div className="md:hidden pb-3 border-t border-slate-800 pt-2">
            <div className="space-y-0.5">
              {mainLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={clsx(
                    'block px-3 py-2.5 rounded text-sm font-medium transition-colors',
                    pathname === l.href ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800',
                  )}>
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">지역 심층 분석</p>
            <div className="space-y-0.5">
              {districtLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={clsx(
                    'block px-3 py-2 rounded text-sm font-medium transition-colors',
                    pathname === l.href ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800',
                  )}>
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="px-3 pt-3 text-xs text-slate-600">데이터: 국토교통부 + 한국부동산원</p>
          </div>
        )}
      </div>
    </nav>
  )
}
