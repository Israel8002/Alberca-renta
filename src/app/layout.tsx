import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Sistema de Reservas En Linea',
  description: 'Reserva tu día de diversión y descanso. Disponibilidad en línea, precios y horarios.',
  keywords: ['alberca', 'renta alberca', 'parque', 'reservaciones'],
  openGraph: {
    title: 'Sistema de Reservas En Linea',
    description: 'Reserva tu día de diversión y descanso. Disponibilidad en línea, precios y horarios.',
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
