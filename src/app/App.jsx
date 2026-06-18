import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import HomePage from '../pages/Home/HomePage'
import VisualisationsPage from '../pages/Visualisations/VisualisationsPage'
import ContactPage from '../pages/Contact/ContactPage'
import FAQPage from '../pages/FAQ/FAQPage'
import DonneesPage from '../pages/Donnees/DonneesPage'
import DetailDatasetPage from '../pages/Donnees/DetailDatasetPage'
import OrganisationsPage from '../pages/Organisations/OrganisationsPage'
import DetailOrganisationPage from '../pages/Organisations/DetailOrganisationPage'
import AuthPage from '../pages/Auth/AuthPage'
import ContributionPage from '../pages/Contribution/ContributionPage'
import OrganizationMembershipRequestPage from '../pages/Contribution/OrganizationMembershipRequestPage'
import NewOrganizationRequestPage from '../pages/Contribution/NewOrganizationRequestPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import ParametresPage from '../pages/Dashboard/ParametresPage'
import { SubscriptionsProvider } from './subscriptions/SubscriptionsContext'
import { useSubscriptions } from './subscriptions/SubscriptionsContext'
import { LanguageProvider } from '../contexts/LanguageContext'

function RequireAuth({ children }) {
  const location = useLocation()
  const { isConnected } = useSubscriptions()
  const allowBypassInDev = import.meta.env.DEV || import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (allowBypassInDev) {
    return children
  }

  if (!isConnected) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  return children
}

function RequireOrganizationMembership({ children }) {
  const location = useLocation()
  const { hasAnyMembership } = useSubscriptions()
  const allowBypassInDev = import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (allowBypassInDev) {
    return children
  }

  if (!hasAnyMembership) {
    return <Navigate to="/organisations/adhesion-organisation" replace state={{ from: location }} />
  }

  return children
}

function RequireContributionAccess({ children }) {
  const location = useLocation()
  const { isConnected, hasAnyMembership } = useSubscriptions()
  const allowBypassInDev = import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (allowBypassInDev) {
    return children
  }

  if (!isConnected) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  if (!hasAnyMembership) {
    return <Navigate to="/organisations/adhesion-organisation" replace state={{ from: location }} />
  }

  return children
}

function RequirePermission({ permission, fallbackTo = '/', children }) {
  const location = useLocation()
  const { isConnected, can } = useSubscriptions()
  const allowBypassInDev = import.meta.env.DEV || import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (allowBypassInDev) {
    return children
  }

  if (!isConnected) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  if (!can(permission)) {
    return <Navigate to={fallbackTo} replace />
  }

  return children
}

export default function App() {
  return (
    <LanguageProvider>
      <SubscriptionsProvider>
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
            <Route path="/donnees" element={<DonneesPage />} />
            <Route path="/donnees/:datasetId" element={<DetailDatasetPage />} />
            <Route path="/organisations" element={<OrganisationsPage />} />
            <Route path="/organisations/:organizationSlug" element={<DetailOrganisationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/connexion" element={<AuthPage />} />
            <Route path="/inscription" element={<AuthPage />} />
            <Route
              path="/organisations/adhesion-organisation"
              element={(
                <RequireAuth>
                  <OrganizationMembershipRequestPage />
                </RequireAuth>
              )}
            />
            <Route path="/adhesion-organisation" element={<Navigate to="/organisations/adhesion-organisation" replace />} />
            <Route
              path="/organisations/nouvelle"
              element={(
                <RequireAuth>
                  <RequirePermission permission="request_org_creation" fallbackTo="/dashboard">
                    <NewOrganizationRequestPage />
                  </RequirePermission>
                </RequireAuth>
              )}
            />
            <Route
              path="/contribution"
              element={(
                <RequireContributionAccess>
                  <ContributionPage />
                </RequireContributionAccess>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <RequireAuth>
                  <RequirePermission permission="dashboard_settings" fallbackTo="/">
                    <DashboardPage />
                  </RequirePermission>
                </RequireAuth>
              )}
            />
            <Route
              path="/dashboard/parametres"
              element={(
                <RequireAuth>
                  <RequirePermission permission="dashboard_settings" fallbackTo="/">
                    <ParametresPage />
                  </RequirePermission>
                </RequireAuth>
              )}
            />
            {/* 404 */}
            <Route path="*" element={<div style={{ padding: '120px 24px', textAlign: 'center' }}>Page introuvable (404)</div>} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </SubscriptionsProvider>
    </LanguageProvider>
  )
}
