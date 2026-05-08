import { useState, useCallback } from 'react'
import './CitadelSection.css'

import slide1Bg from '../../../../assets/Citadel.jpeg'
import missionRecherche from '../../../../assets/recherche.png'
import missionInnovation from '../../../../assets/innovation.png'
import missionDeveloppement from '../../../../assets/developpement.png'
import axeImage from '../../../../assets/AXE.gif'
import activitesMainImage from '../../../../assets/CITADEL-projet.webp'
import icon1 from '../../../../assets/icon-1.svg'
import icon2 from '../../../../assets/icon-2.svg'
import icon3 from '../../../../assets/icon-3.svg'
import icon4 from '../../../../assets/icon-4.svg'
import pUvbf from '../../../../assets/uvbf.png'
import pUjkz from '../../../../assets/ujkz.png'
import pUniLn from '../../../../assets/uni-ln.webp'
import pOpenBurkina from '../../../../assets/openBurkina.png'
import pCidr from '../../../../assets/cidr.png'
import pSida from '../../../../assets/sida.png'
import pAi4d from '../../../../assets/ai4d-africa.png'
import pMdenp from '../../../../assets/mdenp.png'
import mBissyande from '../../../../assets/DrBissyande.png'
import mSabane from '../../../../assets/DrSabane.png'
import mTinto from '../../../../assets/M-Tinto.png'
import mDefault from '../../../../assets/CITADEL-M-min.png'

const MISSION_CARDS = [
  {
    title: '01.RECHERCHE',
    desc: "Mettre en œuvre l'ensemble des théories et des techniques en vue de rendre des machines capables de simuler l'intelligence humaine.",
    image: missionRecherche,
  },
  {
    title: '02.INNOVATION',
    desc: "Amplifier les talents africains de l'IA.",
    image: missionInnovation,
  },
  {
    title: '03.DÉVELOPPEMENT',
    desc: "Utiliser l'intelligence artificielle comme levier de développement.",
    image: missionDeveloppement,
  },
]

const ACTIVITES = [
  {
    title: 'ANALYSER',
    desc: "l'état de l'art de la recherche fondamentale en IA, avec une perspective locale africaine.",
    image: icon1,
  },
  {
    title: 'FORMER',
    desc: "en considérant les couches sociales les moins représentées, notamment la question du genre, pour dynamiser l'industrie locale de l'IA.",
    image: icon2,
  },
  {
    title: 'COORDONNER',
    desc: 'de manière holistique sur la mise en œuvre et le déploiement de modèles d’IA dans des applications concrètes contextualisées.',
    image: icon3,
  },
  {
    title: 'DÉMONTRER',
    desc: "de manière systématique les risques de l'IA afin d'informer les pouvoirs publics et la société civile sur les insuffisances des régulations locales.",
    image: icon4,
  },
]

const PARTENAIRES = [
  { image: pUvbf, desc: 'UNIVERSITÉ VIRTUELLE DU BURKINA FASO', href: '#' },
  { image: pUjkz, desc: 'UNIVERSITÉ JOSEPH KI-ZERBO', href: '#' },
  { image: pUniLn, desc: 'UNIVERSITÉ DE LUXEMBOURG (SnT)', href: '#' },
  { image: pOpenBurkina, desc: 'OPEN BURKINA', href: '#' },
  { image: pCidr, desc: 'IDRC-CRDI', href: '#' },
  { image: pSida, desc: 'SIDA', href: '#' },
  { image: pAi4d, desc: 'ARTIFICIAL INTELLIGENCE FOR DEVELOPMENT AFRICA', href: '#' },
  { image: pMdenp, desc: 'MINISTÈRE DE LA TRANSITION DIGITALE', href: '#' },
]

const MEMBRES = [
  { image: mBissyande, line1: 'Dr. Tégawendé F. BISSYANDE', line2: 'Chercheur principal' },
  { image: mSabane, line1: 'Dr. Aminata ZERBO/SABANE', line2: 'Adjointe au chercheur principal' },
  { image: mTinto, line1: 'Teg-Wende Idriss TINTO', line2: 'Responsable du transfert de technologie' },
  { image: mDefault, line1: 'Dr. Serge A. Sawadogo', line2: 'Leader/Co-lead' },
  { image: mDefault, line1: 'Pr. François Zougmoré', line2: 'Leader/Co-lead' },
  { image: mDefault, line1: 'Dr. Tizane Daho', line2: 'Leader/Co-lead' },
  { image: mDefault, line1: 'Dr. Inoussa Traoré', line2: 'Leader/Co-lead' },
  { image: mDefault, line1: 'Dr. Tiaté Noufè', line2: 'Leader/Co-lead' },
  { image: mDefault, line1: 'Dr. Yacouba N. Nacambo', line2: 'Leader/Co-lead' },
]

const SLIDES = [
  { id: 1, label: 'Présentation CITADEL' },
  { id: 2, label: 'Mission' },
  { id: 3, label: 'Axes stratégiques de recherche' },
  { id: 4, label: 'Activités' },
  { id: 5, label: 'Partenaires' },
  { id: 6, label: 'Membres' },
]

function Slide1() {
  return (
    <div className="citadel-slide citadel-slide--1">
      <img src={slide1Bg} alt="Vue de la CITADEL" className="citadel-slide1__bg" />
      <div className="citadel-slide1__overlay" />
      <div className="citadel-slide1__desc" aria-live="polite">
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--1">Au CITADEL :</p>
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--2">Nous construisons les talents et les capacités en IA</p>
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--3">du Burkina Faso et de l’Afrique.</p>
      </div>
    </div>
  )
}

function Slide2() {
  return (
    <div className="citadel-slide citadel-slide--2">
      <div className="citadel-slide2__top">
        <h3 className="citadel-slide__title">Mission</h3>
        <p className="citadel-slide2__text">
          Notre ambition est de complémenter les initiatives existantes en développant davantage les compétences
          techniques sur les architectures algorithmiques, les processus d’apprentissage et les applications concrètes,
          dans un centre d’excellence interdisciplinaire capable d’accompagner les défis du développement de l’IA.
        </p>
      </div>
      <div className="citadel-slide2__cards">
        {MISSION_CARDS.map((c) => (
          <article key={c.title} className="citadel-slide2__card">
            <img src={c.image} alt={c.title} className="citadel-slide2__card-image" />
            <h4 className="citadel-slide2__card-title">{c.title}</h4>
            <p className="citadel-slide2__card-desc">{c.desc}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function Slide3() {
  return (
    <div className="citadel-slide citadel-slide--3">
      <img src={axeImage} alt="Axes stratégiques de recherche" className="citadel-slide3__image" />
    </div>
  )
}

function Slide4() {
  return (
    <div className="citadel-slide citadel-slide--4">
      <h3 className="citadel-slide__title">Activités</h3>
      <div className="citadel-slide4__left">
        <img src={activitesMainImage} alt="Projets CITADEL" className="citadel-slide4__main-image" />
      </div>
      <div className="citadel-slide4__right">
        <div className="citadel-slide4__list">
          {ACTIVITES.map((item) => (
            <article key={item.title} className="citadel-slide4__item">
              <img src={item.image} alt={item.title} className="citadel-slide4__item-icon" />
              <div className="citadel-slide4__item-content">
                <h4 className="citadel-slide4__item-title">{item.title}</h4>
                <p className="citadel-slide4__item-desc">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function Slide5() {
  return (
    <div className="citadel-slide citadel-slide--5">
      <h3 className="citadel-slide__title">Partenaires</h3>
      <div className="citadel-grid citadel-grid--partners">
        {PARTENAIRES.map((p) => (
          <a key={p.desc} href={p.href} className="citadel-card citadel-partner-card" target="_blank" rel="noopener noreferrer">
            <img src={p.image} alt={p.desc} className="citadel-partner-card__image" />
            <p className="citadel-partner-card__desc"><strong>{p.desc}</strong></p>
          </a>
        ))}
        <a href="#" className="citadel-card citadel-partner-card citadel-partner-card--more" aria-label="Voir plus de partenaires">
          <span className="citadel-partner-card__plus">+</span>
          <p className="citadel-partner-card__desc"><strong>Voir plus de partenaires</strong></p>
        </a>
      </div>
    </div>
  )
}

function Slide6() {
  return (
    <div className="citadel-slide citadel-slide--6">
      <h3 className="citadel-slide__title">Membres</h3>
      <div className="citadel-grid citadel-grid--members">
        {MEMBRES.map((m) => (
          <article key={m.line1} className="citadel-card citadel-member-card">
            <img src={m.image} alt={m.line1} className="citadel-member-card__image" />
            <p className="citadel-member-card__line1"><strong>{m.line1}</strong></p>
            <p className="citadel-member-card__line2">{m.line2}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6]

export default function CitadelSection() {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? SLIDES.length - 1 : c - 1)), [])
  const next = useCallback(() => setCurrent((c) => (c === SLIDES.length - 1 ? 0 : c + 1)), [])

  const SlideComponent = SLIDE_COMPONENTS[current]

  return (
    <section className="citadel-section" aria-label="Présentation CITADEL">
      <div className="citadel-section__header">
        <h2 className="citadel-section__title">[CITADEL]</h2>
        <p className="citadel-section__subtitle">
          Centre d'Excellence Interdisciplinaire en Intelligence Artificielle pour le Développement.
        </p>
      </div>

      <div className="citadel-slider" role="region" aria-label="Slider CITADEL" aria-live="polite">
        <button className="citadel-slider__arrow citadel-slider__arrow--prev" onClick={prev} aria-label="Slide précédent">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="citadel-slider__track">
          <SlideComponent key={current} />
        </div>

        <button className="citadel-slider__arrow citadel-slider__arrow--next" onClick={next} aria-label="Slide suivant">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="citadel-slider__dots" role="tablist" aria-label="Navigation des slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={`citadel-slider__dot${i === current ? ' citadel-slider__dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            role="tab"
            aria-selected={i === current}
            aria-label={s.label}
            title={s.label}
          />
        ))}
      </div>

      <div className="citadel-section__cta">
        <a
          href="https://citadel.bf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          aria-label="Visitez le site officiel de la CITADEL"
        >
          Visitez le site
        </a>
      </div>
    </section>
  )
}
