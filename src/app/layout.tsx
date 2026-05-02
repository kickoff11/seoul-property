import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import MockDataBanner from '@/components/MockDataBanner'
import { isMockFallback } from '@/lib/seed'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '서울 부동산 투명화 | Seoul Property Transparency',
  description:
    '국토교통부 실거래가와 네이버 부동산 호가를 비교해 서울 아파트 시장의 불투명성을 해소하고 거래를 활성화합니다.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <NavBar />
        <MockDataBanner isMock={!process.env.MOLIT_API_KEY || isMockFallback()} />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
