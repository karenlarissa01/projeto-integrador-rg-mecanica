import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

function CadastrarVeiculo() {
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const anoMaximo = new Date().getFullYear() + 1;

  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;
  } catch {
    localStorage.removeItem("usuario");
  }

  const normalizarPlaca = (valor) =>
    valor
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

  const handlePlacaChange = (event) => {
    event.target.value = normalizarPlaca(
      event.target.value
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");

    const placa = normalizarPlaca(
      formData.get("placa")
    );

    const marca = formData.get("marca");
    const modelo = formData.get("modelo");
    const ano = formData.get("ano");
    const quilometragem =
      formData.get("quilometragem");

    if (placa.length !== 7) {
      setError(
        "A placa deve possuir 7 caracteres."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/veiculos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idCliente: usuario.id,
            placa,
            marca,
            modelo,
            ano,
            quilometragem,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.erro ||
            "Não foi possível cadastrar o veículo."
        );
        return;
      }

      form.reset();

      navigate("/meus-veiculos", {
        state: {
          success:
            "Veículo cadastrado com sucesso!",
        },
      });
    } catch (erro) {
      console.error(
        "Erro ao cadastrar veículo:",
        erro
      );

      setError(
        "Não foi possível conectar com o servidor."
      );
    }
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-title__line" />

        <h1>Cadastrar veículo</h1>

        <p>
          Preencha os dados do veículo que deseja
          adicionar à sua conta.
        </p>

        <form
          className="auth__form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="placa">
              Placa
            </label>

            <input
              id="placa"
              name="placa"
              type="text"
              placeholder="ABC1D23"
              maxLength={7}
              onChange={handlePlacaChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="marca">
              Marca
            </label>

            <input
              id="marca"
              name="marca"
              type="text"
              placeholder="Ex.: Chevrolet"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modelo">
              Modelo
            </label>

            <input
              id="modelo"
              name="modelo"
              type="text"
              placeholder="Ex.: Onix"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ano">
              Ano
            </label>

            <input
              id="ano"
              name="ano"
              type="number"
              placeholder="Ex.: 2022"
              min="1900"
              max={anoMaximo}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quilometragem">
              Quilometragem
            </label>

            <input
              id="quilometragem"
              name="quilometragem"
              type="number"
              placeholder="Ex.: 35000"
              min="0"
              step="1"
            />
          </div>

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="button button--primary"
          >
            Cadastrar veículo
          </button>
        </form>

        <Link
          to="/minha-conta"
          className="button button--outline-dark"
        >
          Voltar para minha conta
        </Link>
      </div>
    </section>
  );
}

export default CadastrarVeiculo;