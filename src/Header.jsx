import './Header.css'

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-logo">
          <span className="logo-leaf">🌿</span>
          <div className="logo-text">
            <span className="logo-name">Wild Child</span>
            <span className="logo-sub">Nosara · Registration</span>
          </div>
        </div>
        <a href="https://wildchildnosara.com" className="header-link" target="_blank" rel="noopener noreferrer">
          wildchildnosara.com ↗
        </a>
      </div>
    </header>
  )
}
