import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import ServiceWorkerRegister from './ServiceWorkerRegister'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export const metadata: Metadata = {
  title: 'Car Points',
  description: "Vaughn's road trip points tracker",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Car Points',
    statusBarStyle: 'black-translucent',
    startupImage: '/launch.png',
  },
  icons: {
    apple: [
      { url: '/vaughn_80.png', sizes: '80x80' },
      { url: '/vaughn_120.png', sizes: '120x120' },
      { url: '/vaughn_152.png', sizes: '152x152' },
    ],
  },
}

function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">

        {/* Home */}
        <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-semibold">Points</span>
        </Link>

        {/* Map */}
        <Link href="/map" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-xs font-semibold">Map</span>
        </Link>

        {/* Games */}
        <Link href="/games" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
          </svg>
          <span className="text-xs font-semibold">Games</span>
        </Link>

        {/* World Cup */}
        <Link href="/worldcup" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m6-17H6v5a6 6 0 0012 0V4zm0 0h3v2a3 3 0 01-3 3m-12-5H3v2a3 3 0 003 3" />
          </svg>
          <span className="text-xs font-semibold">Cup</span>
        </Link>

        {/* Admin */}
        <Link href="/admin" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold">Admin</span>
        </Link>

      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <main className="mx-auto max-w-md page-content">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
