import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

function Login() {
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData
      .get("email")
      .trim()
      .toLowerCase();

    const password = formData.get("password");

    setError("");

    try {
    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha: password,
        }),
      }
    );

      const data = await response.json();

      if (!response.ok) {
        if (data.codigo === "EMAIL_NAO_ENCONTRADO") {
          alert(
            "E-mail não localizado. Cadastre-se para fazer o login."
          );

          navigate("/cadastro");
          return;
        }

        setError(
          data.erro ||
            "Não foi possível realizar o login."
        );
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.cliente)
      );

      navigate("/");
    } catch (error) {
      console.error(
        "Erro ao conectar com o backend:",
        error
      );

      setError(
        "Não foi possível conectar com o servidor. Verifique se o backend está ligado."
      );
    }
  };

  return (
    <section className="auth">
      <div className="auth__card">
        <div className="auth__heading">
          <div className="section-title__line" />

          <h1>Entrar</h1>

          <p>
            Entre na sua conta para acessar seus agendamentos.
          </p>
        </div>

        <form
          className="auth__form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="login-email">
              E-mail
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">
              Senha
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
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
            className="button button--primary auth__button"
            type="submit"
          >
            Entrar
          </button>

          <p className="auth__alternative">
            Não tem uma conta?{" "}
            <Link to="/cadastro">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Login;