import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Récupérer la langue sauvegardée ou utiliser FR par défaut
    return localStorage.getItem('citadel_language') || 'fr'
  })

  useEffect(() => {
    // Sauvegarder la langue dans localStorage
    localStorage.setItem('citadel_language', language)
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = language
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr')
  }

  const setLang = (lang) => {
    if (lang === 'fr' || lang === 'en') {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
