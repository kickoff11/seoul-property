'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { href: '/',              label: '대시보드' },
  { href: '/timing',        label: '매수 타이밍' },
  { href: '/reality',       label: '시장 현실' },
  { href: '/supply-demand', label: '공급·수요' },
  { href: '/policy',        label: '정책 분석' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/" className="font-bold text-blue-400 text-lg tracking-tight shrink-0">
          서울부동산 투명화
        </Link>
        <div className="flex gap-1">
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
        <div className="ml-auto text-xs text-slate-500">
          데이터: 국토교통부 + 한국부동산원
        </div>
      </div>
    </nav>
  )
}
