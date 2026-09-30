import { Link } from "react-router-dom";

function Login() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <section className="auth">
      <div className="auth__card">
        <div className="auth__heading">
          <div className="section-title__line" />
          <h1>Entrar</h1>
          <p>Entre na sua conta para acessar seus agendamentos.</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">E-mail</label>
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
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="button button--primary auth__button"
            type="submit"
          >
            Entrar
          </button>

          <p className="auth__alternative">
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Login;