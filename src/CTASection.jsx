import ShareButton from './ShareButton.jsx'

export default function CTASection({ onPremiumClick, onDemoClick }) {
  return (
    <section className="cta">
      <h2 className="cta__title">Ready to explore?</h2>
      <p className="cta__sub">No signup required — open the live atlas and start exploring.</p>
      <div className="cta__buttons">
        <button className="btn btn--primary" onClick={onPremiumClick}>
          Get started
          <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <button className="btn btn--secondary" onClick={onDemoClick}>
          Request a demo
        </button>
      </div>
      <div className="cta__buttons">
        <ShareButton />
      </div>
    </section>
  )
}
