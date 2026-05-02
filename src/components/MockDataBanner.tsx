'use client'

interface Props {
  isMock: boolean
}

/**
 * Shown only when MOLIT_API_KEY is entirely absent (local dev without a key).
 * When the key is set but quota is exhausted, per-section MockBadge is used instead.
 */
export default function MockDataBanner({ isMock }: Props) {
  if (!isMock) return null

  return (
    <div className="bg-slate-800/60 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3">
        <span className="text-slate-400 text-xs font-medium shrink-0">개발 모드</span>
        <p className="text-slate-500 text-xs">
          MOLIT API 키 미설정 — 거래 데이터는 생성된 모의 데이터입니다.
          실제 데이터는{' '}
          <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer"
            className="text-slate-400 underline underline-offset-2 hover:text-slate-200">
            data.go.kr
          </a>
          에서 키를 발급 후{' '}
          <code className="bg-slate-700/60 px-1 rounded text-slate-300">.env.local</code>에 설정하세요.
        </p>
      </div>
    </div>
  )
}
