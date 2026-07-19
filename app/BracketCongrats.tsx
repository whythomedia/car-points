import Confetti from './Confetti'

// One-off celebration banner for the World Cup bracket winner. Shows through the
// end of the cutoff day (Central), then disappears on its own.
const SHOW_THROUGH = '2026-07-20' // Central date key; hidden the day after

export default function BracketCongrats() {
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
  if (todayKey > SHOW_THROUGH) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-teal-50 p-5 text-center dark:border-amber-600/50 dark:from-amber-950/40 dark:to-teal-950/40">
      <Confetti contained durationMs={6000} />
      <div className="relative z-10">
        <div className="text-4xl">🏆</div>
        <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
          Congratulations Owen on winning the World Cup Bracket!
        </p>
        <p className="mt-0.5 text-sm font-semibold text-amber-700 dark:text-amber-300">🎉 Way to go, champ!</p>
      </div>
    </div>
  )
}
