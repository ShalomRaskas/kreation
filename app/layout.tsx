import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kreation — AI that posts in your voice',
  description: 'Generate social media posts that sound exactly like you.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
