import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import HeroSection from './sections/HeroSection'

const CitadelSection = lazy(() => import('./sections/CitadelSection'))
const ModulesSection = lazy(() => import('./sections/ModulesSection'))
const StatusBanner = lazy(() => import('./sections/StatusBanner'))
const MapSection = lazy(() => import('./sections/MapSection'))
const MethodologySection = lazy(() => import('./sections/MethodologySection'))

function DeferredSection({ children, fallbackMinHeight = '24rem' }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return undefined

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={ref} style={{ minHeight: fallbackMinHeight }}>
      {isVisible ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DeferredSection fallbackMinHeight="42rem">
        <CitadelSection />
      </DeferredSection>
      <DeferredSection fallbackMinHeight="20rem">
        <ModulesSection />
      </DeferredSection>
      <DeferredSection fallbackMinHeight="12rem">
        <StatusBanner />
      </DeferredSection>
      <DeferredSection fallbackMinHeight="44rem">
        <MapSection />
      </DeferredSection>
      <DeferredSection fallbackMinHeight="24rem">
        <MethodologySection />
      </DeferredSection>
    </>
  )
}
