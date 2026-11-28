import "./Navigation.css";

function Navigation() {
  return (
    <header className="navbar-wrapper">
      <nav className="navbar" aria-label="Päänavigaatio">
        <a href="#top" className="brand">
          NEEA CAMILLA
        </a>

        <ul className="nav-links">
          <li>
            <a href="#portfolio">Portfolio</a>
          </li>
          <li>
            <a href="#yhteystiedot">Yhteystiedot</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navigation;