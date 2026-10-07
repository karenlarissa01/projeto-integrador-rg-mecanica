import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function MeusVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [error, setError] = useState("");

  const location = useLocation();

  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;
  } catch {
    localStorage.removeItem("usuario");
  }

  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    const carregarVeiculos = async () => {
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/veiculos/${usuario.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.erro ||
              "Não foi possível carregar os veículos."
          );
          return;
        }

        setVeiculos(data.veiculos);
      } catch (erro) {
        console.error(
          "Erro ao carregar veículos:",
          erro
        );

        setError(
          "Não foi possível conectar com o servidor."
        );
      }
    };

    carregarVeiculos();
  }, [usuario?.id]);

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-title__line" />

        <h1>Meus veículos</h1>

        <p>
          Consulte os veículos cadastrados na sua conta.
        </p>

        {location.state?.success && (
          <p className="form-success">
            {location.state.success}
          </p>
        )}

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {veiculos.length === 0 ? (
          <div>
            <p>
              Você ainda não possui veículos cadastrados.
            </p>

            <div className="page-section__actions">
              <Link
                to="/cadastrar-veiculo"
                className="button button--primary"
              >
                Cadastrar veículo
              </Link>

              <Link
                to="/minha-conta"
                className="button button--outline-dark"
              >
                Voltar para minha conta
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="vehicles-list">
              {veiculos.map((veiculo) => (
                <article
                  className="vehicle-card"
                  key={veiculo.id_veiculo}
                >
                  <h2>
                    {veiculo.marca} {veiculo.modelo}
                  </h2>

                  <p>
                    <strong>Placa:</strong>{" "}
                    {veiculo.placa}
                  </p>

                  <p>
                    <strong>Ano:</strong>{" "}
                    {veiculo.ano}
                  </p>

                  {veiculo.quilometragem !== null && (
                    <p>
                      <strong>Quilometragem:</strong>{" "}
                      {veiculo.quilometragem} km
                    </p>
                  )}
                </article>
              ))}
            </div>

            <div className="page-section__actions">
              <Link
                to="/cadastrar-veiculo"
                className="button button--primary"
              >
                Cadastrar novo veículo
              </Link>

              <Link
                to="/minha-conta"
                className="button button--outline-dark"
              >
                Voltar para minha conta
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default MeusVeiculos;