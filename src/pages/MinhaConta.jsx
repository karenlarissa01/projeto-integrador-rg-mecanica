import { Link } from "react-router-dom";

function MinhaConta() {
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;
  } catch {
    localStorage.removeItem("usuario");
  }

  const primeiroNome = usuario?.nome
    ? usuario.nome.split(" ")[0]
    : "";

  return (
    <section className="client-account">
      <div className="container">
        <div className="client-account__heading">
          <div className="section-title__line" />

          <h1>
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}!
          </h1>

          <p>Selecione uma opção para continuar:</p>
        </div>

        <div className="client-account__options">
          <Link
            to="/meus-agendamentos"
            className="client-account__card"
          >
            <h2>Meus agendamentos</h2>

            <p>
              Consulte seus agendamentos e acompanhe o
              status dos serviços solicitados.
            </p>

            <span>Ver agendamentos →</span>
          </Link>

          <Link
            to="/meus-veiculos"
            className="client-account__card"
          >
            <h2>Meus veículos</h2>

            <p>
              Consulte os veículos cadastrados na sua
              conta.
            </p>

            <span>Ver veículos →</span>
          </Link>

          <Link
            to="/cadastrar-veiculo"
            className="client-account__card"
          >
            <h2>Cadastrar veículo</h2>

            <p>
              Adicione um novo veículo para utilizá-lo
              nos seus agendamentos.
            </p>

            <span>Cadastrar veículo →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MinhaConta;