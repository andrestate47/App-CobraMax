
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { DeviceGuard } from '@/components/device-guard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'B.&.D.S.C',
  description: 'Aplicación completa para gestión de préstamos y cobranza',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <DeviceGuard>
            {children}
          </DeviceGuard>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
