import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../styles/Account.css";

function Historico() {
    const [historico, setHistorico] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [servicos, setServicos] = useState([]);

    const [veiculo, setVeiculo] = useState("todos");
    const [servico, setServico] = useState("todos");
    const [valorMin, setValorMin] = useState("");
    const [valorMax, setValorMax] = useState("");
    const [ordemValor, setOrdemValor] = useState("data");
    const [periodo, setPeriodo] = useState("todos");
    const [busca, setBusca] = useState("");

    const [resumo, setResumo] = useState({
        totalAtendimentos: 0,
        totalGasto: 0,
    });

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [filtrosAbertos, setFiltrosAbertos] = useState(false);

    useEffect(() => {
        const carregarOpcoes = async () => {
            try {
                const usuarioSalvo = localStorage.getItem("usuario");

                if (!usuarioSalvo) {
                    throw new Error("Entre na sua conta para consultar seu histórico.");
                }

                const usuario = JSON.parse(usuarioSalvo);

                if (!usuario.id) {
                    throw new Error("Não foi possível identificar sua conta.");
                }

                const [respostaVeiculos, respostaServicos] = await Promise.all([
                    fetch(`${API_URL}/veiculos/${usuario.id}`),
                    fetch(`${API_URL}/servicos`),
                ]);

                const [dadosVeiculos, dadosServicos] = await Promise.all([
                    respostaVeiculos.json(),
                    respostaServicos.json(),
                ]);

                if (!respostaVeiculos.ok) {
                    throw new Error(
                        dadosVeiculos.erro || "Não foi possível carregar os veículos."
                    );
                }

                if (!respostaServicos.ok) {
                    throw new Error(
                        dadosServicos.erro || "Não foi possível carregar os serviços."
                    );
                }

                setVeiculos(dadosVeiculos.veiculos || []);
                setServicos(dadosServicos.servicos || []);
            } catch (erroConsulta) {
                setErro(
                    erroConsulta.message || "Não foi possível carregar os filtros."
                );
            }
        };

        carregarOpcoes();
    }, []);

    useEffect(() => {
        let cancelado = false;

        const carregarHistorico = async () => {
            setCarregando(true);
            setErro("");

            try {
                const usuarioSalvo = localStorage.getItem("usuario");

                if (!usuarioSalvo) {
                    throw new Error("Entre na sua conta para consultar seu histórico.");
                }

                let usuario;

                try {
                    usuario = JSON.parse(usuarioSalvo);
                } catch {
                    throw new Error("Sua sessão não pôde ser identificada. Entre novamente.");
                }

                if (!usuario.id) {
                    throw new Error("Não foi possível identificar sua conta.");
                }

                const parametros = new URLSearchParams();

                if (veiculo !== "todos") parametros.set("veiculo", veiculo);
                if (servico !== "todos") parametros.set("servico", servico);
                if (valorMin !== "") parametros.set("valorMin", valorMin);
                if (valorMax !== "") parametros.set("valorMax", valorMax);
                if (ordemValor !== "data") parametros.set("ordemValor", ordemValor);
                if (periodo !== "todos") parametros.set("periodo", periodo);
                if (busca.trim()) parametros.set("busca", busca.trim());

                const url = `${API_URL}/historico/cliente/${usuario.id}?${parametros.toString()}`;
                const resposta = await fetch(url);
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
                        dados.erro || "Não foi possível carregar o histórico."
                    );
                }

                if (!cancelado) {
                    setHistorico(dados.historico || []);
                    setResumo(
                        dados.resumo || {
                            totalAtendimentos: 0,
                            totalGasto: 0,
                        }
                    );
                }
            } catch (erroConsulta) {
                if (!cancelado) {
                    setErro(
                        erroConsulta.message || "Não foi possível conectar ao servidor."
                    );
                    setHistorico([]);
                    setResumo({ totalAtendimentos: 0, totalGasto: 0 });
                }
            } finally {
                if (!cancelado) setCarregando(false);
            }
        };

        carregarHistorico();

        return () => {
            cancelado = true;
        };
    }, [veiculo, servico, valorMin, valorMax, ordemValor, periodo, busca]);

    const formatarData = (data) => {
        if (!data) return "Não informada";

        const [ano, mes, dia] = String(data).slice(0, 10).split("-");

        return ano && mes && dia ? `${dia}/${mes}/${ano}` : String(data);
    };

    const formatarMoeda = (valor) =>
        Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    return (
        <section className="page-section historico-page">
            <div className="container">
                <div className="section-title__line" />

                <h1>Histórico de serviços</h1>

                <p className="historico-intro">
                    Consulte os serviços realizados nos seus veículos e acompanhe
                    seus gastos com manutenção.
                </p>

                <div className="historico-resumo">
                    <div className="historico-resumo__item">
                        <span>Atendimentos realizados</span>
                        <strong>{resumo.totalAtendimentos ?? 0}</strong>
                        <small>Registros no histórico</small>
                    </div>

                    <div className="historico-resumo__item">
                        <span>Último veículo atendido</span>

                        {resumo.ultimoVeiculo ? (
                            <>
                                <strong>
                                    {resumo.ultimoVeiculo.marca}{" "}
                                    {resumo.ultimoVeiculo.modelo}
                                </strong>

                                <small>
                                    {resumo.ultimoVeiculo.placa}
                                    {resumo.ultimoVeiculo.servico
                                        ? ` · ${resumo.ultimoVeiculo.servico}`
                                        : ""}
                                </small>
                            </>
                        ) : (
                            <strong>Nenhum atendimento registrado</strong>
                        )}
                    </div>
                </div>

                <section
                    className={`historico-filtros ${filtrosAbertos ? "historico-filtros--aberto" : ""
                        }`}
                >
                    <button
                        type="button"
                        className="historico-filtros__toggle"
                        onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                        aria-expanded={filtrosAbertos}
                        aria-controls="historico-filtros-conteudo"
                    >
                        <span>
                            <strong>Filtrar histórico</strong>
                            <small>Encontre serviços por veículo, valor ou período</small>
                        </span>

                        <span
                            className={`historico-filtros__icone ${filtrosAbertos ? "historico-filtros__icone--aberto" : ""
                                }`}
                            aria-hidden="true"
                        >
                            ⌄
                        </span>
                    </button>

                    {filtrosAbertos && (
                        <div
                            id="historico-filtros-conteudo"
                            className="historico-filtros__conteudo"
                        >
                            <div className="historico-filtros__grade">
                                <div className="historico-campo">
                                    <label htmlFor="filtro-veiculo">Veículo</label>
                                    <select
                                        id="filtro-veiculo"
                                        value={veiculo}
                                        onChange={(event) => setVeiculo(event.target.value)}
                                    >
                                        <option value="todos">Todos os veículos</option>
                                        {veiculos.map((item) => (
                                            <option key={item.id_veiculo} value={item.id_veiculo}>
                                                {item.marca} {item.modelo} — {item.placa}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="historico-campo">
                                    <label htmlFor="filtro-servico">Tipo de serviço</label>
                                    <select
                                        id="filtro-servico"
                                        value={servico}
                                        onChange={(event) => setServico(event.target.value)}
                                    >
                                        <option value="todos">Todos os serviços</option>
                                        {servicos.map((item) => (
                                            <option key={item.id_servico} value={item.id_servico}>
                                                {item.nome_serv}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="historico-campo">
                                    <label htmlFor="valor-min">Valor mínimo (R$)</label>
                                    <input
                                        id="valor-min"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={valorMin}
                                        onChange={(event) => setValorMin(event.target.value)}
                                        placeholder="Ex.: 100"
                                    />
                                </div>

                                <div className="historico-campo">
                                    <label htmlFor="valor-max">Valor máximo (R$)</label>
                                    <input
                                        id="valor-max"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={valorMax}
                                        onChange={(event) => setValorMax(event.target.value)}
                                        placeholder="Ex.: 1000"
                                    />
                                </div>

                                <div className="historico-campo">
                                    <label htmlFor="filtro-periodo">Período</label>
                                    <select
                                        id="filtro-periodo"
                                        value={periodo}
                                        onChange={(event) => setPeriodo(event.target.value)}
                                    >
                                        <option value="todos">Todo o histórico</option>
                                        <option value="30">Últimos 30 dias</option>
                                        <option value="365">Últimos 12 meses</option>
                                    </select>
                                </div>

                                <div className="historico-campo">
                                    <label htmlFor="filtro-ordem">Ordenar por</label>
                                    <select
                                        id="filtro-ordem"
                                        value={ordemValor}
                                        onChange={(event) => setOrdemValor(event.target.value)}
                                    >
                                        <option value="data">Mais recentes</option>
                                        <option value="menor">Menor valor</option>
                                        <option value="maior">Maior valor</option>
                                    </select>
                                </div>

                                <div className="historico-campo historico-campo--busca">
                                    <label htmlFor="filtro-busca">
                                        Buscar por serviço, veículo ou descrição
                                    </label>
                                    <input
                                        id="filtro-busca"
                                        type="search"
                                        value={busca}
                                        onChange={(event) => setBusca(event.target.value)}
                                        placeholder="Ex.: troca de óleo, freios, placa..."
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="button button--outline-dark"
                                onClick={() => {
                                    setVeiculo("todos");
                                    setServico("todos");
                                    setValorMin("");
                                    setValorMax("");
                                    setOrdemValor("data");
                                    setPeriodo("todos");
                                    setBusca("");
                                }}
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </section>

                {carregando && (
                    <p className="historico-mensagem" role="status">
                        Carregando histórico...
                    </p>
                )}

                {!carregando && erro && (
                    <p className="mensagem-erro" role="alert">
                        {erro}
                    </p>
                )}

                {!carregando && !erro && historico.length === 0 && (
                    <div className="historico-vazio">
                        <h2>Nenhum atendimento encontrado</h2>
                        <p>
                            Não há serviços realizados que correspondam aos filtros
                            selecionados.
                        </p>
                    </div>
                )}

                {!carregando && !erro && historico.length > 0 && (
                    <div className="historico-lista">
                        {historico.map((item) => (
                            <article className="historico-item" key={item.id_atend}>
                                <div className="historico-item__topo">
                                    <div>
                                        <span className="historico-item__identificador">
                                            Atendimento #{item.id_atend}
                                        </span>
                                        <h2>{item.nome_serv || "Serviço não identificado"}</h2>
                                    </div>

                                    <strong className="historico-item__valor">
                                        {item.valor_servico == null
                                            ? "Valor não informado"
                                            : formatarMoeda(item.valor_servico)}
                                    </strong>
                                </div>

                                <div className="historico-item__detalhes">
                                    <p>
                                        <strong>Veículo:</strong> {item.marca} {item.modelo}
                                    </p>
                                    <p>
                                        <strong>Placa:</strong> {item.placa}
                                    </p>
                                    <p>
                                        <strong>Início:</strong>{" "}
                                        {formatarData(item.data_inicio_atend)}
                                    </p>
                                    <p>
                                        <strong>Conclusão:</strong>{" "}
                                        {formatarData(item.data_fim_atend)}
                                    </p>
                                </div>

                                {item.desc_serv && (
                                    <p className="historico-item__texto">
                                        <strong>Serviço:</strong> {item.desc_serv}
                                    </p>
                                )}

                                {item.motivo && (
                                    <p className="historico-item__texto">
                                        <strong>Motivo:</strong> {item.motivo}
                                    </p>
                                )}

                                {item.observacao && (
                                    <p className="historico-item__texto">
                                        <strong>Observações:</strong> {item.observacao}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}

                <br></br>
            </div>
        </section>
    );
}

export default Historico;
