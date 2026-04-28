const ITEMS = [
  {
    icon: '🗺️',
    title: 'Interactive map',
    desc: "Pan, zoom, and click on any of Halland's protected areas and reserves to see live data.",
  },
  {
    icon: '🎯',
    title: 'Sustainability scores',
    desc: 'Biodiversity, climate resilience, ecosystem health, and visitor pressure — quantified per area.',
  },
  {
    icon: '🔍',
    title: 'Filter & search',
    desc: 'Find parks by type, region, or threat status in milliseconds. Built for field workers and researchers.',
  },
  {
    icon: '📡',
    title: 'Live data streams',
    desc: 'Pulls from Naturvårdsverket, SMHI, and field sensor networks. Updates daily, not yearly.',
  },
  {
    icon: '🌡️',
    title: 'Climate tracking',
    desc: 'See how warming, glacier retreat, and sea-level rise are reshaping each protected area.',
  },
  {
    icon: '📦',
    title: 'Open data export',
    desc: 'Download any view as GeoJSON, CSV, or PDF. No paywalls, no API keys for public data.',
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <h2 className="features__title">Everything you need to track conservation.</h2>
      <p className="features__sub">
        Combining geospatial data, sustainability metrics, and field reports
        <br />
        into one clean view.
      </p>
      <div className="features__grid">
        {ITEMS.map((it) => (
          <div key={it.title} className="feature">
            <div className="feature__icon" aria-hidden>{it.icon}</div>
            <div className="feature__title">{it.title}</div>
            <div className="feature__desc">{it.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
