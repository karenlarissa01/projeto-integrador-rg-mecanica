import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__main">
        <Link to="/" className="footer__logo">
          <img src="/images/logo.png" alt="RG Mecânica" />
        </Link>

        <nav className="footer__nav" aria-label="Navegação do rodapé">
          <Link to="/">Início</Link>
          <a href="/#servicos">Serviços</a>
          <a href="/#contato">Contato</a>
        </nav>

        <div className="footer__contact">
          <a
            href="https://wa.me/5511989493145"
            target="_blank"
            rel="noreferrer"
          >
            ☎ (11) 98949-3145
          </a>

          <span>Rua Evangelista de Souza, 1282</span>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 RG Mecânica. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;