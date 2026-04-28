export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer__line">
        © {new Date().getFullYear()} Sweden Sustainability Atlas · Built with open data from{' '}
        Naturvårdsverket &amp; SMHI · Made with 🌿 in Halland
      </div>
      <div className="footer__line">
        <span className="footer__brand">Built for the Icons Of hackathon</span>
      </div>
    </footer>
  )
}
