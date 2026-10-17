
import { Link } from "react-router-dom";

import '../styles/Account.css'

function MinhaConta() {
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch {
    localStorage.removeItem("usuario");
  }

  const primeiroNome = usuario?.nome
    ? usuario.nome.split(" ")[0]
    : "Cliente";

  const opcoes = [
    {
      titulo: "Meus agendamentos",
      descricao:
        "Consulte seus horários, acompanhe solicitações e confira o status dos serviços.",
      acao: "Consultar agendamentos",
      rota: "/meus-agendamentos",
      icone: "/images/agenda.png",
    },
    {
      titulo: "Meus veículos",
      descricao:
        "Visualize os veículos vinculados à sua conta e consulte suas informações.",
      acao: "Visualizar veículos",
      rota: "/meus-veiculos",
      icone: "/images/carros.png",
    },
    {
      titulo: "Histórico",
      descricao:
        "Verifique o histórico de serviços prestados aos seus veículos.",
      acao: "Visualizar Histórico",
      rota: "/HistoricoServico",
      icone: "/images/historia.png",
    },
  ];

  return (
    <main className="client-account">
      <div className="container">
        <section className="client-account__welcome">
          <div className="client-account__welcome-content">
            <span className="client-account__eyebrow">
              ÁREA DO CLIENTE
            </span>

            <h1>Olá, {primeiroNome}.</h1>

            <p>
              Seja bem-vindo à sua área exclusiva. Gerencie seus
              veículos e acompanhe seus serviços em um só lugar.
            </p>
          </div>

          <div className="client-account__profile">
            <div className="client-account__avatar" aria-hidden="true">
              {primeiroNome.charAt(0).toUpperCase()}
            </div>

            <div className="client-account__profile-info">
              <span className="client-account__profile-label">
                Você está conectado
              </span>
              <strong>{usuario?.nome || "Cliente RG Mecânica"}</strong>
              {usuario?.email && <span>{usuario.email}</span>}
            </div>

            <span
              className="client-account__status"
              title="Sessão ativa"
              aria-label="Sessão ativa"
            />
          </div>
        </section>

        <section className="client-account__content">
          <div className="client-account__section-heading">
            <div>
              <span className="client-account__eyebrow">
                SEU ESPAÇO
              </span>

              <h2>Como podemos ajudar?</h2>

              <p>
                Escolha uma opção para continuar.
              </p>
            </div>
          </div>

          <div className="client-account__options">
            {opcoes.map((opcao) => (
              <Link
                key={opcao.numero}
                to={opcao.rota}
                className="client-account__card"
              >
                <div className="client-account__card-top">
                  <span className="client-account__card-icon">
                    {opcao.icone.startsWith("/") ? (
                      <img src={opcao.icone} alt="" />
                    ) : (
                      opcao.icone
                    )}
                  </span>

                  <span className="client-account__card-number">
                    {opcao.numero}
                  </span>
                </div>

                <h3>{opcao.titulo}</h3>

                <p>{opcao.descricao}</p>

                <span className="client-account__card-action">
                  {opcao.acao}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>

          {/* <section className="client-account__help">
            <div className="client-account__help-mark" aria-hidden="true">
              i
            </div>

            <div className="client-account__help-text">
              <h3>Organize tudo antes de agendar</h3>
              <p>
                Mantenha os dados dos seus veículos atualizados para
                tornar suas próximas solicitações mais simples.
              </p>
            </div>

            <Link
              to="/cadastrar-veiculo"
              className="client-account__help-link"
            >
              Cadastrar veículo
              <span aria-hidden="true">→</span>
            </Link>
          </section> */}
        </section>
      </div>
    </main>
  );
}

export default MinhaConta;
