
import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import "../styles/Agendamento.css";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const horariosDisponiveis = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function Agendamento() {
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const [veiculos, setVeiculos] = useState([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
  const [erroVeiculos, setErroVeiculos] = useState("");

  const [servicos, setServicos] = useState([]);
  const [carregandoServicos, setCarregandoServicos] = useState(true);

  const [veiculo, setVeiculo] = useState("");
  const [servico, setServico] = useState("");
  const [horario, setHorario] = useState("");
  const [observacao, setObservacao] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const hoje = new Date();

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const quantidadeDias = new Date(ano, mes + 1, 0).getDate();

  const dataHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const dataSelecionada = diaSelecionado
    ? new Date(ano, mes, diaSelecionado)
    : null;

  const nomeMes = mesAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const formatarData = (data) => data.toLocaleDateString("pt-BR");

  // Carregar os serviços disponíveis no backend
  useEffect(() => {
    const carregarServicos = async () => {
      try {
        setErro("");

        const resposta = await fetch(`${API_URL}/servicos`);
        const texto = await resposta.text();

        let dados = {};

        if (texto) {
          try {
            dados = JSON.parse(texto);
          } catch {
            throw new Error(
              `Resposta inválida ao carregar serviços (HTTP ${resposta.status}).`
            );
          }
        }

        if (!resposta.ok) {
          throw new Error(
            dados.erro || dados.message || "Erro ao carregar serviços."
          );
        }

        setServicos(dados.servicos || []);
      } catch (erroConsulta) {
        setErro(
          erroConsulta.message || "Não foi possível carregar os serviços."
        );
      } finally {
        setCarregandoServicos(false);
      }
    };

    carregarServicos();
  }, []);

  // Carregar os veículos do cliente conectado
  useEffect(() => {
    const carregarVeiculos = async () => {
      try {
        const usuarioSalvo = localStorage.getItem("usuario");

        if (!usuarioSalvo) {
          setErroVeiculos("Entre na sua conta para consultar seus veículos.");
          return;
        }

        const usuarioLogado = JSON.parse(usuarioSalvo);

        if (!usuarioLogado.id) {
          setErroVeiculos("Não foi possível identificar sua conta.");
          return;
        }

        const resposta = await fetch(
          `${API_URL}/veiculos/${usuarioLogado.id}`
        );

        const texto = await resposta.text();
        let dados = {};

        if (texto) {
          try {
            dados = JSON.parse(texto);
          } catch {
            throw new Error(
              `Resposta inválida ao carregar veículos (HTTP ${resposta.status}).`
            );
          }
        }

        if (!resposta.ok) {
          throw new Error(
            dados.erro ||
            dados.message ||
            "Não foi possível carregar os veículos."
          );
        }

        setVeiculos(dados.veiculos || []);
      } catch (erroConsulta) {
        setErroVeiculos(
          erroConsulta.message || "Não foi possível conectar ao servidor."
        );
      } finally {
        setCarregandoVeiculos(false);
      }
    };

    carregarVeiculos();
  }, []);

  const voltarMes = () => {
    const novoMes = new Date(ano, mes - 1, 1);

    // Não permitir navegar para meses anteriores ao mês atual
    if (
      novoMes.getFullYear() < dataHoje.getFullYear() ||
      (novoMes.getFullYear() === dataHoje.getFullYear() &&
        novoMes.getMonth() < dataHoje.getMonth())
    ) {
      return;
    }

    setMesAtual(novoMes);
    setDiaSelecionado(null);
    setHorario("");
    setMensagem("");
    setErro("");
  };

  const avancarMes = () => {
    setMesAtual(new Date(ano, mes + 1, 1));
    setDiaSelecionado(null);
    setHorario("");
    setMensagem("");
    setErro("");
  };

  const selecionarDia = (dia) => {
    const data = new Date(ano, mes, dia);

    if (data < dataHoje || data.getDay() === 0) {
      return;
    }

    setDiaSelecionado(dia);
    setHorario("");
    setMensagem("");
    setErro("");
  };

  // Enviar a solicitação de agendamento para o backend
  const solicitarAgendamento = async (event) => {
    event.preventDefault();

    if (enviando) return;

    setMensagem("");
    setErro("");

    try {
      const usuarioSalvo = localStorage.getItem("usuario");

      if (!usuarioSalvo) {
        throw new Error("Entre na sua conta para agendar.");
      }

      let usuarioLogado;

      try {
        usuarioLogado = JSON.parse(usuarioSalvo);
      } catch {
        throw new Error("Não foi possível identificar sua conta. Entre novamente.");
      }

      if (!usuarioLogado.id) {
        throw new Error("Não foi possível identificar sua conta.");
      }

      if (!diaSelecionado || !veiculo || !servico || !horario) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }

      const dataAgend = [
        ano,
        String(mes + 1).padStart(2, "0"),
        String(diaSelecionado).padStart(2, "0"),
      ].join("-");

      setEnviando(true);

      const resposta = await fetch(`${API_URL}/agendamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idCliente: usuarioLogado.id,
          idVeiculo: Number(veiculo),
          idServico: Number(servico),
          dataAgend,
          horarioAgend: horario,
          observacao: observacao.trim(),
        }),
      });

      const texto = await resposta.text();
      let dados = {};

      if (texto) {
        try {
          dados = JSON.parse(texto);
        } catch {
          throw new Error(
            `Resposta inválida do servidor (HTTP ${resposta.status}). Verifique a URL da API.`
          );
        }
      }

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          dados.message ||
          "Não foi possível solicitar o agendamento."
        );
      }

      setMensagem(
        `Agendamento #${dados.id_agend} solicitado com sucesso! Aguarde a análise da sua solicitação.`
      );

      setDiaSelecionado(null);
      setVeiculo("");
      setServico("");
      setHorario("");
      setObservacao("");
    } catch (erroEnvio) {
      setErro(
        erroEnvio.message || "Não foi possível conectar ao servidor."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="page-section agendamento-page">
      <div className="container">
        <br></br>
        <div className="section-title__line" />
        <h1>Agendar serviço</h1>

        <p className="agendamento-intro">
          Escolha uma data para solicitar seu atendimento.
          <b> A confirmação será realizada pela nossa equipe.</b>
        </p>

        <div className="agendamento-layout">
          {/* Calendário */}
          <div className="calendario-card">
            <div className="calendario-cabecalho">
              <button
                type="button"
                onClick={voltarMes}
                aria-label="Mês anterior"
                disabled={
                  ano === dataHoje.getFullYear() &&
                  mes === dataHoje.getMonth()
                }
              >
                ‹
              </button>

              <h2>{nomeMes}</h2>

              <button
                type="button"
                onClick={avancarMes}
                aria-label="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="calendario-grade">
              {diasSemana.map((dia) => (
                <div key={dia} className="calendario-dia-semana">
                  {dia}
                </div>
              ))}

              {Array.from({ length: primeiroDia }).map((_, index) => (
                <div
                  key={`vazio-${index}`}
                  className="calendario-dia vazio"
                />
              ))}

              {Array.from(
                { length: quantidadeDias },
                (_, index) => index + 1
              ).map((dia) => {
                const data = new Date(ano, mes, dia);
                const passado = data < dataHoje;
                const domingo = data.getDay() === 0;
                const selecionado = dia === diaSelecionado;

                return (
                  <button
                    key={dia}
                    type="button"
                    className={`calendario-dia ${selecionado ? "selecionado" : ""
                      } ${passado || domingo ? "indisponivel" : ""
                      }`}
                    disabled={passado || domingo}
                    onClick={() => selecionarDia(dia)}
                    aria-pressed={selecionado}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>

            <div className="calendario-legenda">
              <span>
                <i className="legenda-disponivel" />
                Dia selecionável
              </span>

              <span>
                <i className="legenda-indisponivel" />
                Passado ou domingo
              </span>
            </div>

            <p className="calendario-aviso">
              A seleção do dia não garante a disponibilidade do horário.
            </p>
          </div>

          {/* Formulário */}
          <div className="agendamento-form-card">
            <h2>Dados do agendamento</h2>

            {dataSelecionada ? (
              <p className="data-escolhida">
                Data selecionada:{" "}
                <strong>{formatarData(dataSelecionada)}</strong>
              </p>
            ) : (
              <p className="texto-auxiliar">
                Selecione um dia no calendário para continuar.
              </p>
            )}

            {mensagem && (
              <p className="mensagem-sucesso" role="status">
                {mensagem}
              </p>
            )}

            {erro && (
              <p className="mensagem-erro" role="alert">
                {erro}
              </p>
            )}

            <form onSubmit={solicitarAgendamento}>
              <label htmlFor="veiculo">Veículo</label>

              <select
                id="veiculo"
                value={veiculo}
                onChange={(event) => setVeiculo(event.target.value)}
                required
                disabled={carregandoVeiculos || veiculos.length === 0}
              >
                <option value="">
                  {carregandoVeiculos
                    ? "Carregando seus veículos..."
                    : veiculos.length === 0
                      ? "Nenhum veículo cadastrado"
                      : "Selecione seu veículo"}
                </option>

                {veiculos.map((item) => (
                  <option
                    key={item.id_veiculo}
                    value={item.id_veiculo}
                  >
                    {item.marca} {item.modelo} — {item.placa}
                  </option>
                ))}
              </select>

              {erroVeiculos && (
                <p className="texto-auxiliar" role="alert">
                  {erroVeiculos}
                </p>
              )}

              {!carregandoVeiculos &&
                !erroVeiculos &&
                veiculos.length === 0 && (
                  <p className="texto-auxiliar">
                    Cadastre um veículo antes de solicitar um agendamento.
                  </p>
                )}

              <label htmlFor="servico">Serviço</label>

              <select
                id="servico"
                value={servico}
                onChange={(event) => setServico(event.target.value)}
                required
                disabled={carregandoServicos || servicos.length === 0}
              >
                <option value="">
                  {carregandoServicos
                    ? "Carregando serviços..."
                    : servicos.length === 0
                      ? "Nenhum serviço disponível"
                      : "Selecione o serviço"}
                </option>

                {servicos.map((item) => (
                  <option
                    key={item.id_servico}
                    value={item.id_servico}
                  >
                    {item.nome_serv}
                  </option>
                ))}
              </select>

              <label htmlFor="horario">Horário</label>

              <select
                id="horario"
                value={horario}
                onChange={(event) => setHorario(event.target.value)}
                required
              >
                <option value="">Selecione um horário</option>

                {horariosDisponiveis.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </select>

              <label htmlFor="observacao">
                Observações (opcional)
              </label>

              <textarea
                id="observacao"
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Descreva algum detalhe sobre o serviço..."
                rows={3}
              />

              <button
                className="agendamento-botao"
                type="submit"
                disabled={
                  enviando ||
                  !diaSelecionado ||
                  !veiculo ||
                  !servico ||
                  !horario ||
                  carregandoServicos ||
                  carregandoVeiculos
                }
              >
                {enviando
                  ? "Enviando solicitação..."
                  : "Solicitar agendamento"}
              </button>

              <p className="texto-auxiliar">
                Seu pedido ficará pendente até a análise do administrador.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Agendamento;
