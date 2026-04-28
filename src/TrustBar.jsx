const PARTNERS = [
  { icon: '🌿', name: 'Naturvårdsverket' },
  { icon: '🐼', name: 'WWF Sverige' },
  { icon: '🦌', name: 'Länsstyrelsen' },
  { icon: '🌧️', name: 'SMHI' },
  { icon: '⛺', name: 'STF' },
  { icon: '🐦', name: 'BirdLife' },
]

export default function TrustBar() {
  return (
    <section className="trust" id="trust">
      <div className="trust__label">Trusted by Sweden's leading conservation organizations</div>
      <div className="trust__logos">
        {PARTNERS.map((p) => (
          <div key={p.name} className="trust__logo">
            <span className="trust__logo-icon" aria-hidden>{p.icon}</span>
            <span>{p.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
