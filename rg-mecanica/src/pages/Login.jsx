import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email");
    const password = formData.get("password");

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Resposta do login:", data);

      if (!response.ok) {
        setError(
          data.message || "E-mail ou senha incorretos."
        );
        return;
      }

      // Salva os dados do usuário no navegador
      localStorage.setItem(
        "usuario",
        JSON.stringify(data.user)
      );

      setSuccess("Login realizado com sucesso!");

      // Aguarda um pouco para mostrar a notificação
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setError(
        "Não foi possível conectar ao servidor."
      );
    }
  };

  return (
    <>
      {/* NOTIFICAÇÃO DE SUCESSO */}
      {success && (
        <div className="notification notification--success">
          <div className="notification__icon">
            ✓
          </div>

          <div className="notification__content">
            <strong>Login realizado!</strong>
            <span>{success}</span>
          </div>

          <button
            type="button"
            className="notification__close"
            onClick={() => setSuccess("")}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      )}

      <section className="auth">
        <div className="auth__card">

          <div className="auth__heading">
            <div className="section-title__line" />

            <h1>Entrar</h1>

            <p>
              Entre na sua conta para acessar seus
              agendamentos.
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

            {/* MENSAGEM DE ERRO */}
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
    </>
  );
}

export default Login;