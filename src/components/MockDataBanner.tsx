'use client'

interface Props {
  isMock: boolean
}

export default function MockDataBanner({ isMock }: Props) {
  if (!isMock) return null

  return (
    <div className="bg-amber-950/60 border-b border-amber-700/60">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-amber-400 text-sm font-bold shrink-0">⚠ 모의 데이터</span>
        <p className="text-amber-300/80 text-xs leading-snug">
          현재 모든 수치는 실제 데이터가 아닌 <strong className="text-amber-300">추정·모의 데이터</strong>입니다.
          실제 거래 데이터를 보려면 국토교통부 API 키를 발급받아{' '}
          <code className="bg-amber-900/40 px-1 rounded text-amber-200">.env.local</code>에 설정하세요.
        </p>
        <a
          href="https://www.data.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 text-xs text-amber-400 underline underline-offset-2 hover:text-amber-200 transition-colors whitespace-nowrap"
        >
          API 발급 →
        </a>
      </div>
    </div>
  )
}
