'use client'

import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroCarouselProps {
  images: string[]
  title: string
}

export default function HeroCarousel({ images, title }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ])
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const placeholders = [
    'https://images.unsplash.com/photo-1572462027731-7f5f7cf8b7e9?w=1200&q=80',
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
    'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=1200&q=80',
  ]

  const slides = images.length > 0 ? images : placeholders

  useEffect(() => {
    if (!emblaApi) return
    setCount(emblaApi.scrollSnapList().length)
    emblaApi.on('select', () => setCurrent(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 80px)', minHeight: 500 }}>
      {/* Carousel */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((src, i) => (
            <div key={i} className="relative flex-none w-full h-full">
              <img
                src={src}
                alt={`Alberca Santo Niño ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,31,55,0.75) 0%, rgba(0,31,55,0.3) 60%, transparent 100%)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hero content */}
      <div
        className="absolute inset-0 flex items-center"
        style={{ padding: '0 6vw' }}
      >
        <div className="animate-fade-in" style={{ maxWidth: 560 }}>
          {/* Badge */}
          <span
            className="inline-block text-white text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: 'rgba(0,180,216,0.3)',
              border: '1px solid rgba(0,180,216,0.5)',
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
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            {title || 'Alberca Santo Niño'}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              marginBottom: 32,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
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
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
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
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
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
