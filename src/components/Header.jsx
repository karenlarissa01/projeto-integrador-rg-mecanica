import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Header() {
  const [usuario, setUsuario] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  const getSectionLink = (section) =>
    isHome ? `#${section}` : `/#${section}`;

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      setUsuario(null);
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioSalvo));
    } catch {
      localStorage.removeItem("usuario");
      setUsuario(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container header__container">
        <Link to="/" className="header__logo">
          <img src="/images/logo.png" alt="RG Mecânica" />
        </Link>

        <nav
          className="header__nav"
          aria-label="Navegação principal"
        >
          <Link
            to="/"
            className={isHome ? "header__nav-active" : ""}
          >
            Início
          </Link>

          <a href={getSectionLink("servicos")}>
            Serviços
          </a>

          <a href={getSectionLink("contato")}>
            Contato
          </a>
        </nav>

        <div className="header__actions">
          {usuario ? (
            <>
              <Link
                to="/minha-conta"
                className="header__login"
              >
                Minha conta
              </Link>

              <button
                type="button"
                className="header__logout"
                onClick={handleLogout}
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="header__login"
            >
              Entrar
            </Link>
          )}

          <Link
            to={usuario ? "/agendamento" : "/login"}
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