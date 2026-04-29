import GoldenSpotBrowser from "../GoldenSpotBrowser.jsx";

export default function Hero({ onPremiumClick }) {
    return (
        <section className="hero">
            <div className="hero__inner">
                <div className="hero__badge">
                    <span className="hero__badge-dot" />
                    Live data from SMHI Strång, OSM &amp; E-PRTR
                </div>
                <h1 className="hero__title">
                    Find Your Golden Spot:{" "}
                    <span className="hero__title-soft">
                        Smart Planning for Halland 2030
                    </span>
                </h1>
                <p className="hero__sub">
                    Click anywhere on the Halland map to score industrial
                    solar suitability — combining real-time solar irradiance,
                    road access, pollution proximity, and legal risk. Sites
                    inside protected areas are auto-flagged as Forbidden.
                </p>
                <div className="hero__mockup-wrap">
                    <GoldenSpotBrowser onPremiumClick={onPremiumClick} />
                </div>
            </div>
        </section>
    );
}