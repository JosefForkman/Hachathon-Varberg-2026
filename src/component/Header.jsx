import WeatherMotion from "../WeatherMotion.jsx";

export default function Header() {
    return (
        <header className="header">
            <div className="header__inner">
                <a href="/" className="header__brand">
                    <img src="/logo.png" alt="" className="header__logo-img" />
                    <span>S-Halland</span>
                </a>

                <nav className="header__nav" aria-label="Main">
                    <a href="#features">Features</a>
                    <a href="#explore">Live demo</a>
                    <a href="#trust">Data</a>
                    <a href="#about">About</a>
                </nav>

                <div className="header__right">
                    <a
                        href="https://www.iconsof.se"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="header__icons-of"
                        title="Built for the Icons Of hackathon">
                        <span className="header__icons-of-dot" />
                        Built with Icons Of
                        <svg
                            className="header__icons-of-arrow"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden>
                            <path
                                d="M5 11L11 5M11 5H6M11 5V10"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </a>
                    <WeatherMotion />
                </div>
            </div>
        </header>
    );
}
