import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import HomePage from '../pages/Home/HomePage'
import SecuritePage from '../pages/modules/Securite/SecuritePage'
import PopulationPage from '../pages/modules/Population/PopulationPage'
import EducationPage from '../pages/modules/Education/EducationPage'
import EconomiePage from '../pages/modules/Economie/EconomiePage'
import SantePage from '../pages/modules/Sante/SantePage'
import ContactPage from '../pages/Contact/ContactPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Modules thématiques */}
          <Route path="/modules/securite"   element={<SecuritePage />} />
          <Route path="/modules/population" element={<PopulationPage />} />
          <Route path="/modules/education"  element={<EducationPage />} />
          <Route path="/modules/economie"   element={<EconomiePage />} />
          <Route path="/modules/sante"      element={<SantePage />} />
          {/* Autres routes */}
          <Route path="/donnees"       element={<div style={{ padding: '120px 24px', textAlign: 'center' }}>Catalogue des données — à venir</div>} />
          <Route path="/organisations" element={<div style={{ padding: '120px 24px', textAlign: 'center' }}>Organisations — à venir</div>} />
          <Route path="/contact"       element={<ContactPage />} />
          {/* 404 */}
          <Route path="*" element={<div style={{ padding: '120px 24px', textAlign: 'center' }}>Page introuvable (404)</div>} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
