import type { Metadata } from 'next'
import './globals.css'
import { Montserrat, Overpass } from 'next/font/google'
import { cn } from '@/lib/utils'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const overpass = Overpass({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '800'],
})

export const metadata: Metadata = {
  title: 'Trim Key Flow — Command Center',
  description: 'Payment Infrastructure & Orchestration Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn('dark', montserrat.variable, overpass.variable)}>
      <body className="bg-[#0B111E] text-[#F1F5F9] font-sans min-h-screen antialiased selection:bg-[#26C3EA]/20 selection:text-[#26C3EA]">
        {children}
      </body>
    </html>
  )
}
