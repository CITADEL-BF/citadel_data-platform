import { createContext, useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const DOMAINES = ['securite', 'population', 'education', 'economie', 'sante']

const VisualisationsContext = createContext(null)

export function VisualisationsProvider({ children }) {
  const navigate = useNavigate()
  const { domaine } = useParams()

  const activeDomaine = DOMAINES.includes(domaine) ? domaine : null

  const [globalFilters, setGlobalFilters] = useState({
    region: 'Toutes les Regions',
    periode: 'Annuel',
    organisation: 'Toutes les organisations',
  })

  const [contextFilters, setContextFilters] = useState({
    securite: { type: 'Tous', fenetre: 'Derniers 12 Mois' },
    population: { type: 'Tous', fenetre: 'Annuel' },
    education: { type: 'Tous', fenetre: 'Annuel' },
    economie: { type: 'Tous', fenetre: 'Annuel' },
    sante: { type: 'Tous', fenetre: 'Annuel' },
  })

  const setActiveDomaine = (nextDomaine) => {
    if (!nextDomaine) {
      navigate('/visualisations')
      return
    }
    navigate(`/visualisations/${nextDomaine}`)
  }

  const setGlobalFilter = (key, value) => {
    setGlobalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const setContextFilter = (domaineKey, key, value) => {
    setContextFilters((prev) => ({
      ...prev,
      [domaineKey]: {
        ...(prev[domaineKey] || {}),
        [key]: value,
      },
    }))
  }

  const value = useMemo(() => ({
    activeDomaine,
    globalFilters,
    contextFilters,
    setActiveDomaine,
    setGlobalFilter,
    setContextFilter,
  }), [activeDomaine, globalFilters, contextFilters])

  return (
    <VisualisationsContext.Provider value={value}>
      {children}
    </VisualisationsContext.Provider>
  )
}

export function useVisualisations() {
  const context = useContext(VisualisationsContext)
  if (!context) {
    throw new Error('useVisualisations must be used within VisualisationsProvider')
  }
  return context
}
