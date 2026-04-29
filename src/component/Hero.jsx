import MapBrowser from "../MapBrowser.jsx";

export default function Hero({ onPremiumClick }) {
    return (
        <section className="hero" id="explore">
            <div className="hero__inner">
                <div className="hero__badge">
                    <span className="hero__badge-dot" />
                    Live data from Halland's protected areas &amp; SMHI
                    forecasts
                </div>
                <h1 className="hero__title">
                    Protect what makes
                    <span className="hero__title-soft">Sweden, Sweden.</span>
                </h1>
                <p className="hero__sub">
                    An interactive atlas of Halland's protected areas. Track
                    biodiversity, climate resilience, and ecosystem health — all
                    in one place, updated continuously.
                </p>
                <div className="hero__mockup-wrap">
                    <MapBrowser onPremiumClick={onPremiumClick} />
                </div>
            </div>
        </section>
    );
}
