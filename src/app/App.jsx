import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import HomePage from '../pages/Home/HomePage'
import VisualisationsPage from '../pages/Visualisations/VisualisationsPage'
import ContactPage from '../pages/Contact/ContactPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visualisations" element={<VisualisationsPage />} />
          <Route path="/visualisations/:domaine" element={<VisualisationsPage />} />

          {/* Redirections legacy modules vers la SPA unifiee */}
          <Route path="/modules/securite" element={<Navigate to="/visualisations/securite" replace />} />
          <Route path="/modules/population" element={<Navigate to="/visualisations/population" replace />} />
          <Route path="/modules/education" element={<Navigate to="/visualisations/education" replace />} />
          <Route path="/modules/economie" element={<Navigate to="/visualisations/economie" replace />} />
          <Route path="/modules/sante" element={<Navigate to="/visualisations/sante" replace />} />
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
