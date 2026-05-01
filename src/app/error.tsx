'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <p className="text-4xl">⚠️</p>
      <div>
        <p className="text-slate-200 text-base font-semibold">페이지 오류가 발생했습니다</p>
        <p className="text-slate-400 text-sm mt-1">
          브라우저 번역 기능이 켜져 있으면 일부 버튼 조작 시 오류가 발생할 수 있습니다.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          다시 시도
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          페이지 새로고침
        </button>
      </div>
      <p className="text-slate-600 text-xs">
        브라우저 번역을 끄고 새로고침하면 정상 작동합니다.
      </p>
    </div>
  )
}
