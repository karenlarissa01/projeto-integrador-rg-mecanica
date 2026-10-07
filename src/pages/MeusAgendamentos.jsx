import { Link } from "react-router-dom";

function MeusAgendamentos() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="section-title__line" />

        <h1>Meus agendamentos</h1>

        <p>
          Aqui você poderá acompanhar seus serviços
          agendados.
        </p>

        <p>
          Você ainda não possui agendamentos cadastrados.
        </p>

        <div className="page-section__actions">
          <Link
            to="/agendamento"
            className="button button--primary"
          >
            Agendar serviço
          </Link>

          <Link
            to="/minha-conta"
            className="button button--outline-dark"
          >
            Voltar para minha conta
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MeusAgendamentos;