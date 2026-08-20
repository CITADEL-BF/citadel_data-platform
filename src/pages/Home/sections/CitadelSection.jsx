import { useState, useCallback } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { TRANSLATIONS } from './translations'
import './CitadelSection.css'

import slide1Bg from '../../../../assets/home/Citadel.jpeg'
import missionRecherche from '../../../../assets/home/recherche.png'
import missionInnovation from '../../../../assets/home/innovation.png'
import missionDeveloppement from '../../../../assets/home/developpement.png'
import axeImage from '../../../../assets/home/AXE.gif'
import activitesMainImage from '../../../../assets/home/CITADEL-projet.webp'
import icon1 from '../../../../assets/home/icon-1.svg'
import icon2 from '../../../../assets/home/icon-2.svg'
import icon3 from '../../../../assets/home/icon-3.svg'
import icon4 from '../../../../assets/home/icon-4.svg'
import pUvbf from '../../../../assets/partre/uvbf.png'
import pUjkz from '../../../../assets/partre/ujkz.png'
import pUniLn from '../../../../assets/partre/uni-ln.webp'
import pOpenBurkina from '../../../../assets/partre/openBurkina.png'
import pCidr from '../../../../assets/partre/cidr.png'
import pSida from '../../../../assets/partre/sida.png'
import pAi4d from '../../../../assets/partre/ai4d-africa.png'
import pMdenp from '../../../../assets/partre/mdenp.png'
import mBissyande from '../../../../assets/mbrs/DrBissyande.png'
import mSabane from '../../../../assets/mbrs/DrSabane.png'
import mTinto from '../../../../assets/mbrs/M-Tinto.png'
import mDefault from '../../../../assets/mbrs/CITADEL-M-min.png'

const MISSION_IMAGES = [missionRecherche, missionInnovation, missionDeveloppement]
const ACTIVITY_ICONS = [icon1, icon2, icon3, icon4]


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

const MEMBRE_IMAGES = [
  mBissyande,
  mSabane,
  mTinto,
  mDefault,
  mDefault,
  mDefault,
  mDefault,
  mDefault,
  mDefault,
  mDefault,
  mDefault,
]

const NUM_SLIDES = 6

function Slide1({ t }) {
  return (
    <div className="citadel-slide citadel-slide--1">
      <img src={slide1Bg} alt={t.slides.slide1.alt} className="citadel-slide1__bg" width={1920} height={1080} />
      <div className="citadel-slide1__overlay" />
      <div className="citadel-slide1__desc" aria-live="polite">
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--1">{t.slides.slide1.line1}</p>
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--2">{t.slides.slide1.line2}</p>
        <p className="citadel-slide1__desc-line citadel-slide1__desc-line--3">{t.slides.slide1.line3}</p>
      </div>
    </div>
  )
}

function Slide2({ t }) {
  return (
    <div className="citadel-slide citadel-slide--2">
      <div className="citadel-slide2__top">
        <h3 className="citadel-slide__title">{t.slides.slide2.title}</h3>
        <p className="citadel-slide2__text">
          {t.slides.slide2.desc}
        </p>
      </div>
      <div className="citadel-slide2__cards">
        {t.slides.slide2.missions.map((mission, idx) => (
          <article key={mission.title} className="citadel-slide2__card">
            <img src={MISSION_IMAGES[idx]} alt={mission.title} className="citadel-slide2__card-image" width={350} height={350} />
            <h4 className="citadel-slide2__card-title">{mission.title}</h4>
            <p className="citadel-slide2__card-desc">{mission.desc}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
function Slide3({ t }) {
  return (
    <div className="citadel-slide citadel-slide--3">
      <img src={axeImage} alt={t.slides.slide3.alt} className="citadel-slide3__image" width={600} height={400} />
    </div>
  )
}

function Slide4({ t }) {
  return (
    <div className="citadel-slide citadel-slide--4">
      <h3 className="citadel-slide__title">{t.slides.slide4.title}</h3>
      <div className="citadel-slide4__left">
        <img src={activitesMainImage} alt={t.slides.slide4.alt} className="citadel-slide4__main-image" width={500} height={500} />
      </div>
      <div className="citadel-slide4__right">
        <div className="citadel-slide4__list">
          {t.slides.slide4.activities.map((activity, idx) => (
            <article key={activity.title} className="citadel-slide4__item">
              <img src={ACTIVITY_ICONS[idx]} alt={activity.title} className="citadel-slide4__item-icon" width={40} height={40} />
              <div className="citadel-slide4__item-content">
                <h4 className="citadel-slide4__item-title">{activity.title}</h4>
                <p className="citadel-slide4__item-desc">{activity.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function Slide5({ t }) {
  return (
    <div className="citadel-slide citadel-slide--5">
      <h3 className="citadel-slide__title">{t.slides.slide5.title}</h3>
      <div className="citadel-grid citadel-grid--partners">
        {PARTENAIRES.map((p) => (
          <a key={p.desc} href={p.href} className="citadel-card citadel-partner-card" target="_blank" rel="noopener noreferrer">
            <img src={p.image} alt={p.desc} className="citadel-partner-card__image" width={200} height={100} />
            <p className="citadel-partner-card__desc"><strong>{p.desc}</strong></p>
          </a>
        ))}
        <a href="#" className="citadel-card citadel-partner-card citadel-partner-card--more" aria-label={t.slides.slide5.morePartnersAriaLabel}>
          <span className="citadel-partner-card__plus">+</span>
          <p className="citadel-partner-card__desc"><strong>{t.slides.slide5.morePartners}</strong></p>
        </a>
      </div>
    </div>
  )
}

function Slide6({ t }) {
  return (
    <div className="citadel-slide citadel-slide--6">
      <h3 className="citadel-slide__title">{t.slides.slide6.title}</h3>
      <div className="citadel-grid citadel-grid--members">
        {t.slides.slide6.members.map((member, idx) => (
          <article key={member.line1} className="citadel-card citadel-member-card">
            <img src={MEMBRE_IMAGES[idx]} alt={member.line1} className="citadel-member-card__image" width={180} height={240} />
            <p className="citadel-member-card__line1"><strong>{member.line1}</strong></p>
            <p className="citadel-member-card__line2">{member.line2}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6]

export default function CitadelSection() {
  const { language } = useLanguage()
  const t = TRANSLATIONS[language].citadel
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? NUM_SLIDES - 1 : c - 1)), [])
  const next = useCallback(() => setCurrent((c) => (c === NUM_SLIDES - 1 ? 0 : c + 1)), [])

  const SlideComponent = SLIDE_COMPONENTS[current]

  return (
    <section className="citadel-section" aria-label={t.ariaLabel}>
      <div className="citadel-section__header">
        <h2 className="citadel-section__title">{t.title}</h2>
        <p className="citadel-section__subtitle">
          {t.subtitle}
        </p>
      </div>

      <div className="citadel-slider" role="region" aria-label={t.sliderAriaLabel} aria-live="polite">
        <button className="citadel-slider__arrow citadel-slider__arrow--prev" onClick={prev} aria-label={t.prevSlide}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="citadel-slider__track">
          <SlideComponent key={current} t={t} />
        </div>

        <button className="citadel-slider__arrow citadel-slider__arrow--next" onClick={next} aria-label={t.nextSlide}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="citadel-slider__dots" role="tablist" aria-label={t.dotsAriaLabel}>
        {t.slides.labels.map((label, i) => (
          <button
            key={i}
            className={`citadel-slider__dot${i === current ? ' citadel-slider__dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            role="tab"
            aria-selected={i === current}
            aria-label={label}
            title={label}
          />
        ))}
      </div>

      <div className="citadel-section__cta">
        <a
          href="https://citadel.bf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          aria-label={t.ctaAriaLabel}
        >
          {t.ctaButton}
        </a>
      </div>
    </section>
  )
}
