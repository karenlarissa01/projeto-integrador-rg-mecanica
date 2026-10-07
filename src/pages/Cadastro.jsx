import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Cadastro() {
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const formatarTelefone = (valor) => {
    let telefone = valor.replace(/\D/g, "").slice(0, 11);

    if (telefone.length > 7) {
      telefone = telefone.replace(
        /^(\d{2})(\d{5})(\d{0,4}).*/,
        "($1) $2-$3"
      );
    } else if (telefone.length > 2) {
      telefone = telefone.replace(
        /^(\d{2})(\d{0,5})/,
        "($1) $2"
      );
    } else if (telefone.length > 0) {
      telefone = telefone.replace(
        /^(\d{0,2})/,
        "($1"
      );
    }

    return telefone;
  };

  const formatarCpf = (valor) => {
    let cpf = valor.replace(/\D/g, "").slice(0, 11);

    cpf = cpf
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");

    return cpf;
  };

  const calcularIdade = (dataNascimento) => {
    const nascimento = new Date(
      `${dataNascimento}T00:00:00`
    );

    const hoje = new Date();

    let idade =
      hoje.getFullYear() - nascimento.getFullYear();

    const aniversarioAindaNaoAconteceu =
      hoje.getMonth() < nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() &&
        hoje.getDate() < nascimento.getDate());

    if (aniversarioAindaNaoAconteceu) {
      idade--;
    }

    return idade;
  };

  const handlePhoneChange = (event) => {
    event.target.value = formatarTelefone(
      event.target.value
    );
  };

  const handleCpfChange = (event) => {
    event.target.value = formatarCpf(
      event.target.value
    );
  };

  const handleBirthDateInput = (event) => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    const year = value.split("-")[0];

    if (year.length > 4) {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget
    );

    const name = formData.get("name");
    const birthDate = formData.get("birthDate");
    const cpf = formData.get("cpf");
    const email = formData
      .get("email")
      .trim()
      .toLowerCase();
    const phone = formData.get("phone");
    const password = formData.get("password");
    const confirmPassword = formData.get(
      "confirmPassword"
    );

    const cpfLimpo = cpf.replace(/\D/g, "");
    const telefoneLimpo = phone.replace(/\D/g, "");
    const idade = calcularIdade(birthDate);

    if (idade < 18) {
      setError(
        "É preciso ser maior de idade para concluir a criação da conta"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "As senhas informadas não coincidem."
      );
      return;
    }

    if (cpfLimpo.length !== 11) {
      setError(
        "O CPF deve possuir 11 dígitos."
      );
      return;
    }

    setError("");

    try {
      const response = await fetch(
        "http://localhost:3000/cadastro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: name,
            email,
            telefone: telefoneLimpo,
            dataNascimento: birthDate,
            cpf: cpfLimpo,
            senha: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.erro ||
            "Não foi possível realizar o cadastro."
        );
        return;
      }

      alert("Cadastro realizado com sucesso!");

      navigate("/login");
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
    <section className="auth auth--register">
      <div className="auth__card auth__card--large">
        <div className="auth__heading">
          <div className="section-title__line" />

          <h1>Crie sua conta</h1>

          <p>
            Preencha seus dados para realizar seus
            agendamentos na RG Mecânica.
          </p>
        </div>

        <form
          className="auth__form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="name">
              Nome completo
            </label>

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
            <label htmlFor="birthDate">
              Data de nascimento
            </label>

            <input
              id="birthDate"
              name="birthDate"
              type="date"
              autoComplete="bday"
              onInput={handleBirthDateInput}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cpf">
              CPF
            </label>

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
            <label htmlFor="register-email">
              E-mail
            </label>

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
            <label htmlFor="phone">
              Telefone
            </label>

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
            <label htmlFor="register-password">
              Senha
            </label>

            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Crie uma senha"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirmar senha
            </label>

            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Digite sua senha novamente"
              autoComplete="new-password"
              minLength={6}
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
            Criar conta
          </button>

          <p className="auth__alternative">
            Já possui uma conta?{" "}
            <Link to="/login">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Cadastro;