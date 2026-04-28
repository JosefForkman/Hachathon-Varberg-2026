import WeatherMotion from './WeatherMotion.jsx'

export default function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <a href="#" className="header__brand">
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
          <WeatherMotion />
        </div>
      </div>
    </header>
  )
}
