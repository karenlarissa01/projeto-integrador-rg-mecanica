import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const getSectionLink = (section) =>
    isHome ? `#${section}` : `/#${section}`;

  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          <img src="/images/logo.png" alt="RG Mecânica" />
        </Link>

        <nav className="header__nav" aria-label="Navegação principal">
          <Link
            to="/"
            className={isHome ? "header__nav-active" : ""}
          >
            Início
          </Link>

          <a href={getSectionLink("servicos")}>Serviços</a>
          <a href={getSectionLink("contato")}>Contato</a>
        </nav>

        <div className="header__actions">
          <Link to="/login" className="header__login">
            Entrar
          </Link>

          <Link
            to="/login"
            className="button button--primary header__schedule"
          >
            Agendar serviço
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;