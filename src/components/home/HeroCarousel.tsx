'use client'

import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react'

interface HeroCarouselProps {
  images: string[]
  title: string
}

// Default images including real Alberca Santo Niño photo
const DEFAULT_PLACEHOLDERS = [
  '/alberca1.jpg',
  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=1600&q=80',
]

export default function HeroCarousel({ images, title }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ])
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({})

  const validImages = images && images.length > 0 ? images : DEFAULT_PLACEHOLDERS

  useEffect(() => {
    if (!emblaApi) return
    setCount(emblaApi.scrollSnapList().length)
    emblaApi.on('select', () => setCurrent(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  function handleImageError(index: number) {
    setFailedImages((prev) => ({ ...prev, [index]: true }))
  }

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 80px)', minHeight: 520, background: '#0D2137' }}>
      {/* Carousel */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {validImages.map((src, i) => (
            <div key={i} className="relative flex-none w-full h-full" style={{ background: '#0D2137' }}>
              {!failedImages[i] ? (
                <img
                  src={src}
                  alt={`Alberca Santo Niño ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(i)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0D2137 0%, #005F8E 50%, #00B4D8 100%)',
                  }}
                >
                  <Waves size={80} color="rgba(255,255,255,0.2)" />
                </div>
              )}

              {/* Overlay gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(13,33,55,0.85) 0%, rgba(13,33,55,0.45) 60%, transparent 100%)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hero content */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ padding: '0 6vw', pointerEvents: 'none' }}
      >
        <div className="animate-fade-in" style={{ maxWidth: 560, pointerEvents: 'auto' }}>
          {/* Badge */}
          <span
            className="inline-block text-white text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: 'rgba(0,180,216,0.35)',
              border: '1px solid rgba(0,180,216,0.6)',
              padding: '6px 16px',
              borderRadius: 999,
              backdropFilter: 'blur(8px)',
            }}
          >
            🏊 Renta por día
          </span>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: 20,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {title || 'Alberca Santo Niño'}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              marginBottom: 32,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            El lugar ideal para disfrutar en familia. Reserva tu fecha en línea de
            forma rápida y sencilla.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href="/reservar" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              📅 Ver Disponibilidad
            </a>
            <a
              href="#info"
              className="btn-secondary"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                fontSize: '1rem',
                padding: '14px 32px',
              }}
            >
              Ver Costos
            </a>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {count > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
          }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
