import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import '@fontsource-variable/inter'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SaasApp',
    template: '%s | SaasApp',
  },
  description: 'B2B multi-tenant SaaS platform for managing business operations.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
