import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kreation — Turn Your Ideas Into Reality',
  description: 'AI-powered content script generator built for creators.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
