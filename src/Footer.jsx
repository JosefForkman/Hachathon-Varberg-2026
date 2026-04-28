export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer__line">
        © {new Date().getFullYear()} S-Halland · Built with open data from{' '}
        Naturvårdsverket &amp; SMHI · Made with 🌿 in Halland
      </div>
      <div className="footer__line">
        Built for the{' '}
        <a
          className="footer__brand"
          href="https://www.iconsof.se"
          target="_blank"
          rel="noopener noreferrer"
        >
          Icons Of
        </a>{' '}
        hackathon ·{' '}
        <a
          className="footer__brand"
          href="https://www.linkedin.com/company/iconsof"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
