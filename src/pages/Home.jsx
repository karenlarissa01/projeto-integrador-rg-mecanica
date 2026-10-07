import { Link } from "react-router-dom";

import ServiceCard from "../components/ServiceCard";
import services from "../data/services";

function Home() {
  const usuarioLogado = localStorage.getItem("usuario");

  const destinoAgendamento = usuarioLogado
    ? "/agendamento"
    : "/login";

  return (
    <>
      <section className="hero" id="inicio">
        <div className="container hero__content">
          <div className="hero__line" />

          <h1>
            <span>RG</span> MECÂNICA
          </h1>

          <p>
            Há mais de 20 anos conquistando
            <br />
            confiança a cada serviço.
          </p>

          <div className="hero__actions">
            <Link
              to={destinoAgendamento}
              className="button button--primary"
            >
              Agendar serviço
            </Link>

            <a
              href="#servicos"
              className="button button--outline"
            >
              Conheça nossos serviços
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section className="services" id="servicos">
        <div className="container">
          <div className="section-title section-title--center">
            <div className="section-title__line" />
            <h2>Conheça nossos serviços</h2>
          </div>

          <div className="services__grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contato">
        <div className="container contact__container">
          <div className="contact__info">
            <div className="section-title section-title--light">
              <div className="section-title__line" />
              <h2>Entre em contato</h2>
            </div>

            <p className="contact__intro">
              Estamos prontos para te atender!
            </p>

            <div className="contact__details">
              <div className="contact__item">
                <span
                  className="contact__icon"
                  aria-hidden="true"
                >
                  ●
                </span>

                <div>
                  <h3>Endereço</h3>

                  <p>
                    Rua Evangelista de Souza, 1282
                    <br />
                    São Paulo - SP
                  </p>
                </div>
              </div>

              <div className="contact__item">
                <span
                  className="contact__icon"
                  aria-hidden="true"
                >
                  ☎
                </span>

                <div>
                  <h3>WhatsApp</h3>

                  <a
                    href="https://wa.me/5511989493145"
                    target="_blank"
                    rel="noreferrer"
                  >
                    (11) 98949-3145
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="contact__visual">
            <div className="contact__visual-content">
              <span>RG Mecânica</span>
              <strong aria-hidden="true">●</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;