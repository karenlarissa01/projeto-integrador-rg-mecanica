
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";

function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregarAgendamentos = async () => {
      try {
        setErro("");

        const usuarioSalvo = localStorage.getItem("usuario");

        if (!usuarioSalvo) {
          throw new Error("Entre na sua conta para consultar seus agendamentos.");
        }

        let usuario;

        try {
          usuario = JSON.parse(usuarioSalvo);
        } catch {
          throw new Error("Não foi possível identificar sua conta. Entre novamente.");
        }

        if (!usuario.id) {
          throw new Error("Não foi possível identificar o cliente conectado.");
        }

        const resposta = await fetch(
          `${API_URL}/agendamentos/cliente/${usuario.id}`
        );

        const texto = await resposta.text();
        let dados = {};

        if (texto) {
          try {
            dados = JSON.parse(texto);
          } catch {
            throw new Error(
              `Resposta inválida do servidor (HTTP ${resposta.status}).`
            );
          }
        }

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível carregar seus agendamentos."
          );
        }

        setAgendamentos(dados.agendamentos || []);
      } catch (erroConsulta) {
        setErro(
          erroConsulta.message || "Não foi possível conectar ao servidor."
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarAgendamentos();
  }, []);

  const formatarData = (data) => {
    if (!data) return "Data não informada";

    // Evita alteração de dia por conversão de fuso horário.
    const dataFormatada = String(data).slice(0, 10);
    const [ano, mes, dia] = dataFormatada.split("-");

    if (!ano || !mes || !dia) return dataFormatada;

    return `${dia}/${mes}/${ano}`;
  };

  const formatarHorario = (horario) => {
    return horario ? String(horario).slice(0, 5) : "--:--";
  };

  const statusInfo = {
    SOLICITADO: {
      texto: "Aguardando confirmação",
      classe: "status-solicitado",
    },
    CONFIRMADO: {
      texto: "Confirmado",
      classe: "status-confirmado",
    },
    RECUSADO: {
      texto: "Recusado",
      classe: "status-recusado",
    },
    CANCELADO: {
      texto: "Cancelado",
      classe: "status-cancelado",
    },
    CONCLUIDO: {
      texto: "Concluído",
      classe: "status-concluido",
    },
  };

  return (
    <section className="page-section meus-agendamentos-page">
      <div className="container">
        <div className="section-title__line" />

        <h1>Meus agendamentos</h1>

        <p>
          Acompanhe as solicitações dos seus serviços e confira o status
          de cada atendimento.
        </p>

        {carregando && (
          <p role="status">Carregando seus agendamentos...</p>
        )}

        {!carregando && erro && (
          <div className="mensagem-erro" role="alert">
            {erro}
          </div>
        )}

        {!carregando && !erro && agendamentos.length === 0 && (
          <div className="agendamentos-vazio">
            <h2>Nenhum agendamento encontrado</h2>
            <p>
              Você ainda não possui agendamentos cadastrados.
            </p>

            <Link
              to="/agendamento"
              className="button button--primary"
            >
              Agendar serviço
            </Link>
          </div>
        )}

        {!carregando && !erro && agendamentos.length > 0 && (
          <div className="lista-agendamentos">
            {agendamentos.map((item) => {
              const status = statusInfo[item.status_agend] || {
                texto: item.status_agend || "Status desconhecido",
                classe: "status-desconhecido",
              };

              return (
                <article
                  className="agendamento-item"
                  key={item.id_agend}
                >
                  <div className="agendamento-item__cabecalho">
                    <h2>Agendamento #{item.id_agend}</h2>

                    <span className={`status-agendamento ${status.classe}`}>
                      {status.texto}
                    </span>
                  </div>

                  <div className="agendamento-item__detalhes">
                    <p>
                      <strong>Serviço:</strong>{" "}
                      {item.nome_serv}
                    </p>

                    <p>
                      <strong>Veículo:</strong>{" "}
                      {item.marca} {item.modelo}
                    </p>

                    <p>
                      <strong>Placa:</strong>{" "}
                      {item.placa}
                    </p>

                    <p>
                      <strong>Data:</strong>{" "}
                      {formatarData(item.data_agend)}
                    </p>

                    <p>
                      <strong>Horário:</strong>{" "}
                      {formatarHorario(item.horario_agend)}
                    </p>

                    {item.observacao && (
                      <p>
                        <strong>Observações:</strong>{" "}
                        {item.observacao}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="page-section__actions">
          
          <br></br>

          <Link
            to="/minha-conta"
            className="button button--outline-dark"
          >
            Voltar para minha conta
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MeusAgendamentos;
