import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Alberca Santo Niño',
  description: 'Reserva tu día de diversión y descanso en Alberca Santo Niño. Disponibilidad en línea, precios y horarios.',
  keywords: ['alberca', 'renta alberca', 'Alberca Santo Niño', 'reservaciones'],
  openGraph: {
    title: 'Alberca Santo Niño',
    description: 'Reserva tu día de diversión y descanso en Alberca Santo Niño.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '12px',
              background: '#0D2137',
              color: 'white',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'white' },
            },
          }}
        />
      </body>
    </html>
  )
}
