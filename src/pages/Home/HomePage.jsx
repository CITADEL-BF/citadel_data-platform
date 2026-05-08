import HeroSection from './sections/HeroSection'
import CitadelSection from './sections/CitadelSection'
import ModulesSection from './sections/ModulesSection'
import StatusBanner from './sections/StatusBanner'
import MapSection from './sections/MapSection'
import MethodologySection from './sections/MethodologySection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CitadelSection />
      <ModulesSection />
      <StatusBanner />
      <MapSection />
      <MethodologySection />
    </>
  )
}
