const ITEMS = [
    {
        icon: "🗺️",
        title: "Interactive map",
        desc: "Pan, zoom, and click anywhere on Halland to score that location for solar + industrial development in real time.",
    },
    {
        icon: "🎯",
        title: "Green ROI Engine",
        desc: "Automated suitability scoring (0-100) based on solar potential, proximity to infrastructure (OSM), and nature conservation constraints (NVR v3).",
    },
    {
        icon: "🔍",
        title: "Industrial Site Filtering",
        desc: "Filter through Halland's vast lands to find 'Golden Spots' by solar radiation levels, land type, and legal availability in milliseconds.",
    },
    {
        icon: "📡",
        title: "Live data streams",
        desc: "Pulls from Naturvårdsverket, SMHI Strång solar radiation, and E-PRTR emission monitoring. Real-time and audit-ready.",
    },
    {
        icon: "☀️",
        title: "Energy Potential Tracking",
        desc: "Real-time solar yield forecasting and historical weather patterns to ensure your green infrastructure is built for the climate of 2030.",
    },
    {
        icon: "📄",
        title: "Professional Feasibility Reports",
        desc: "Download comprehensive PDF/CSV reports including legal status, solar ROI, and infrastructure analysis to speed up your building permit application.",
    },
];

export default function Features() {
    return (
        <section className="features" id="features">
            <h2 className="features__title">
                Everything you need for Smart &amp; Sustainable Site Selection.
            </h2>
            <p className="features__sub">
                Combining geospatial data, solar irradiance, and pollution
                registries
                <br />
                into one decision-ready view.
            </p>
            <div className="features__grid">
                {ITEMS.map((it) => (
                    <div key={it.title} className="feature">
                        <div className="feature__icon" aria-hidden>
                            {it.icon}
                        </div>
                        <div className="feature__title">{it.title}</div>
                        <div className="feature__desc">{it.desc}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}