import { Link } from "react-router";
import ShareButton from "../Sharebutton.jsx";

export default function CTASection({ onDemoClick }) {
    return (
        <section className="cta" id="explore">
            <h2 className="cta__title">Ready to explore?</h2>
            <p className="cta__sub">
                Want to view the map in a bigger interface? Click{" "}
                <strong>Get started</strong> to open the full-screen Golden Spot Finder.
            </p>
            <div className="cta__buttons">
                <Link to="/map" className="btn btn--primary">
                    Get started
                    <svg
                        className="btn__icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </Link>
                <button className="btn btn--secondary" onClick={onDemoClick}>
                    Request a demo
                </button>
            </div>
            <div className="cta__buttons">
                <ShareButton />
            </div>
        </section>
    );
}
