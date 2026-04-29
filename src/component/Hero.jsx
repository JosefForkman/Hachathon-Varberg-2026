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
                    Find Your Golden Spot: 
                    <span className="hero__title-soft">Smart Planning for Halland 2030</span>
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
