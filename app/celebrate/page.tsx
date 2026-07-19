'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import Confetti from '../Confetti'

function CelebrateContent() {
  const params = useSearchParams()
  const kid = params.get('kid') ?? 'Someone'
  const action = params.get('action') ?? 'earned points!'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Confetti />
      <div className="relative z-10">
        <div className="mb-4 text-7xl">🎉</div>
        <h1 className="mb-2 text-4xl font-black text-white">{kid}!</h1>
        <p className="mb-8 text-xl font-semibold text-teal-300">{action}</p>
        <Link
          href="/"
          className="rounded-full bg-teal-600 px-8 py-3 font-bold text-white transition-colors hover:bg-teal-500"
        >
          See the scoreboard
        </Link>
      </div>
    </div>
  )
}

export default function CelebratePage() {
  return (
    <Suspense>
      <CelebrateContent />
    </Suspense>
  )
}
