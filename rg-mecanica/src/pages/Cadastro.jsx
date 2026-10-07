import { useState } from "react";
import { Link } from "react-router-dom";

function Cadastro() {
  const [error, setError] = useState("");

  const handlePhoneChange = (event) => {

    let value = event.target.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    if (value.length > 7) {
      value = value.replace(
        /^(\d{2})(\d{5})(\d{0,4}).*/,
        "($1) $2-$3"
      );
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/^(\d{0,2})/, "($1");
    }

    event.target.value = value;
  };

  const handleCpfChange = (event) => {
    let value = event.target.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    value = value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");

    event.target.value = value;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const birthDate = formData.get("birthDate");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    const birth = new Date(`${birthDate}T00:00:00`);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const birthdayHasNotHappenedYet =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate());

    if (birthdayHasNotHappenedYet) {
      age--;
    }

    if (age < 18) {
      setError(
        "É preciso ser maior de idade para concluir a criação da conta"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setError("");
  };

  return (
    <section className="auth auth--register">
      <div className="auth__card auth__card--large">
        <div className="auth__heading">
          <div className="section-title__line" />
          <h1>Crie sua conta</h1>
          <p>
            Preencha seus dados para realizar seus agendamentos na RG
            Mecânica.
          </p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Digite seu nome completo"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">Data de nascimento</label>
            <input
            id="birthDate"
            name="birthDate"
            type="date"
            autoComplete="bday"
            required
            onInput={(event) => {
              const value = event.target.value;

              if (value) {
                const year = value.split("-")[0];

                if (year.length > 4) {
                  event.target.value = "";
                }
              }
            }}
          />
          </div>

            <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              onChange={handleCpfChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">E-mail</label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={15}
              onChange={handlePhoneChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Senha</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Crie uma senha"
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar senha</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Digite sua senha novamente"
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button--primary auth__button"
            type="submit"
          >
            Criar conta
          </button>

          <p className="auth__alternative">
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Cadastro;