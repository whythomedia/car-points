import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

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

        {/* Vault */}
        <Link href="/bonus" className="flex flex-col items-center gap-1 px-4 py-1 text-slate-500 hover:text-teal-600 transition-colors dark:text-slate-400 dark:hover:text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-semibold">Vault</span>
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
        <main className="mx-auto max-w-md page-content">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
