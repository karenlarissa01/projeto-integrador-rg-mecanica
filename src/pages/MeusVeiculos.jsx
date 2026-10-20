import { useCallback, useEffect, useState } from "react";

import { API_URL } from "../config/api";

import "../styles/Account.css";

// Marcas e modelos sugeridos. A opção "Outra marca" permite veículos fora da lista.*

const MODELOS_POR_MARCA = {

  Toyota: ["Corolla", "Corolla Cross", "Etios", "Hilux", "Yaris", "SW4", "Outro modelo"],

  Honda: ["Civic", "City", "Fit", "HR-V", "WR-V", "CR-V", "Outro modelo"],

  Volkswagen: ["Gol", "Polo", "T-Cross", "Nivus", "Virtus", "Voyage", "Saveiro", "Outro modelo"],

  Chevrolet: ["Onix", "Onix Plus", "Tracker", "Cruze", "Spin", "S10", "Prisma", "Outro modelo"],

  Fiat: ["Argo", "Mobi", "Cronos", "Pulse", "Fastback", "Toro", "Strada", "Uno", "Outro modelo"],

  Hyundai: ["HB20", "HB20S", "Creta", "Tucson", "ix35", "Outro modelo"],

  Ford: ["Ka", "Fiesta", "EcoSport", "Ranger", "Territory", "Outro modelo"],

  Renault: ["Kwid", "Sandero", "Logan", "Duster", "Captur", "Oroch", "Outro modelo"],

  Nissan: ["Kicks", "Versa", "Sentra", "March", "Frontier", "Outro modelo"],

  Jeep: ["Renegade", "Compass", "Commander", "Wrangler", "Outro modelo"],

  BMW: ["Série 1", "Série 3", "Série 5", "X1", "X3", "X5", "Outro modelo"],

  "Mercedes-Benz": ["Classe A", "Classe C", "Classe E", "GLA", "GLC", "Outro modelo"],

  Audi: ["A3", "A4", "A5", "Q3", "Q5", "Outro modelo"],

  Kia: ["Picanto", "Cerato", "Sportage", "Sorento", "Outro modelo"],

  Peugeot: ["208", "2008", "3008", "Outro modelo"],

  Citroën: ["C3", "Aircross", "C4 Cactus", "Outro modelo"],

  Mitsubishi: ["L200", "ASX", "Outlander", "Eclipse Cross", "Outro modelo"],

  Suzuki: ["Jimny", "Vitara", "S-Cross", "Outro modelo"],

};

const LOGOS_MARCA = {

  Toyota: "toyota", Honda: "honda", Volkswagen: "volkswagen", Chevrolet: "chevrolet",

  Fiat: "fiat", Hyundai: "hyundai", Ford: "ford", Renault: "renault", Nissan: "nissan",

  Jeep: "jeep", BMW: "bmw", "Mercedes-Benz": "mercedesbenz", Audi: "audi", Kia: "kia",

  Peugeot: "peugeot", "Citroën": "citroen", Mitsubishi: "mitsubishi", Suzuki: "suzuki",

};

function MarcaLogo({ marca, grande = false }) {

  const [falhou, setFalhou] = useState(false);

  const slug = LOGOS_MARCA[marca];

  return (

    <span className={`vehicles-brand-logo${grande ? " vehicles-brand-logo--large" : ""}`} aria-label={`Logo ${marca || "da marca"}`}>

      {slug && !falhou ? (

        <img

          src={`https://cdn.simpleicons.org/${slug}`}

          alt={`Logo ${marca}`}

          onError={() => setFalhou(true)}

        />

      ) : (

        <span aria-hidden="true">{(marca || "V").trim().slice(0, 2).toUpperCase()}</span>

      )}

    </span>

  );

}

// Mantém somente letras e números, remove espaços/hífens e converte para maiúsculas.*

const normalizarPlaca = (valor) =>

  valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

function MeusVeiculos() {

  const [veiculos, setVeiculos] = useState([]);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [veiculoEditando, setVeiculoEditando] = useState(null);

  const [salvando, setSalvando] = useState(false);

  const [excluindoId, setExcluindoId] = useState(null);

  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState(null);

  const [usuario, setUsuario] = useState(() => {

    try {

      return JSON.parse(localStorage.getItem("usuario")) || null;

    } catch {

      localStorage.removeItem("usuario");

      return null;

    }

  });

  const [form, setForm] = useState({

    placa: "",

    marca: "",

    marcaPersonalizada: "",

    modelo: "",

    modeloPersonalizado: "",

    ano: "",

    quilometragem: "",

  });

  const [erroFormulario, setErroFormulario] = useState("");

  const carregarVeiculos = useCallback(async () => {

    if (!usuario?.id) {

      setErro("Entre na sua conta para consultar seus veículos.");

      setCarregando(false);

      return;

    }

    setCarregando(true);

    setErro("");

    try {

      const response = await fetch(

        `${API_URL}/veiculos/${usuario.id}`

      );

      const texto = await response.text();

      let data;

      try {

        data = JSON.parse(texto);

      } catch {

        throw new Error(

          `O servidor retornou uma resposta inesperada (HTTP ${response.status}). Verifique a rota da API.`

        );

      }

      if (!response.ok) {
        throw new Error(data.erro || "Não foi possível carregar os veículos.");
      }

      setVeiculos(Array.isArray(data.veiculos) ? data.veiculos : []);

    } catch (error) {

      setErro(error.message || "Não foi possível conectar ao servidor.");

    } finally {

      setCarregando(false);

    }

  }, [usuario?.id]);

  useEffect(() => {

    carregarVeiculos();

  }, [carregarVeiculos]);

  function abrirCadastro() {

    setVeiculoEditando(null);

    setForm({

      placa: "",

      marca: "",

      marcaPersonalizada: "",

      modelo: "",

      modeloPersonalizado: "",

      ano: "",

      quilometragem: "",

    });

    setErroFormulario("");

    setModalAberto(true);

  }

  function abrirEdicao(veiculo) {

    setVeiculoEditando(veiculo);

    const marcaConhecida = Object.prototype.hasOwnProperty.call(MODELOS_POR_MARCA, veiculo.marca || "");

    const modeloConhecido = marcaConhecida && (MODELOS_POR_MARCA[veiculo.marca] || []).includes(veiculo.modelo || "");

    setForm({

      placa: veiculo.placa || "",

      marca: marcaConhecida ? veiculo.marca : "__outra__",

      marcaPersonalizada: marcaConhecida ? "" : (veiculo.marca || ""),

      modelo: modeloConhecido ? veiculo.modelo : (marcaConhecida ? "__outro_modelo__" : "__outro_modelo__"),

      modeloPersonalizado: modeloConhecido ? "" : (veiculo.modelo || ""),

      ano: String(veiculo.ano || ""),

      quilometragem:

        veiculo.quilometragem == null

          ? ""

          : String(veiculo.quilometragem),

    });

    setErroFormulario("");

    setModalAberto(true);

  }

  function fecharModal() {

    if (salvando) return;

    setModalAberto(false);

    setVeiculoEditando(null);

    setErroFormulario("");

  }

  function atualizarCampo(event) {

    const { name, value } = event.target;

    setForm((anterior) => {

      if (name === "marca") {

        return { ...anterior, marca: value, marcaPersonalizada: "", modelo: value === "__outra__" ? "__outro_modelo__" : "", modeloPersonalizado: "" };

      }

      if (name === "modelo") {

        return { ...anterior, modelo: value, modeloPersonalizado: "" };

      }

      return {

        ...anterior,

        [name]: name === "placa" ? normalizarPlaca(value).slice(0, 7) : value,

      };

    });

  }

  async function salvarVeiculo(event) {

    event.preventDefault();

    setErroFormulario("");

    setMensagem("");

    if (!usuario?.id) {

      setErroFormulario("Sua sessão não foi identificada. Entre novamente.");

      return;

    }

    const placa = normalizarPlaca(form.placa);

    const marca = form.marca === "__outra__" ? form.marcaPersonalizada.trim() : form.marca.trim();

    const modelo = form.modelo === "__outro_modelo__" ? form.modeloPersonalizado.trim() : form.modelo.trim();

    const ano = Number(form.ano);

    const quilometragem =

      form.quilometragem.trim() === "" ? null : Number(form.quilometragem);

    if (placa.length !== 7) {

      setErroFormulario("A placa deve possuir 7 caracteres.");

      return;

    }

    if (!marca) {

      setErroFormulario("Selecione ou informe a marca do veículo.");

      return;

    }

    if (!modelo || modelo === "__outro_modelo__") {

      setErroFormulario("Selecione ou informe o modelo do veículo.");

      return;

    }

    if (!Number.isInteger(ano) || ano < 1900 || ano > new Date().getFullYear() + 1) {

      setErroFormulario("Informe um ano válido.");

      return;

    }

    if (

      quilometragem !== null &&

      (!Number.isFinite(quilometragem) || quilometragem < 0)

    ) {

      setErroFormulario("Informe uma quilometragem válida.");

      return;

    }

    const payload = {

      idCliente: usuario.id,

      placa,

      marca,

      modelo,

      ano,

      quilometragem,

    };

    setSalvando(true);

    try {

      const editando = Boolean(veiculoEditando);

      const url = editando

        ? `${API_URL}/veiculos/${veiculoEditando.id_veiculo}`

        : `${API_URL}/veiculos`;

      const response = await fetch(url, {

        method: editando ? "PUT" : "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(payload),

      });

      const texto = await response.text();
      let data = {};

      if (texto) {
        try {
          data = JSON.parse(texto);
        } catch {
          throw new Error(
            `O servidor retornou uma resposta inesperada (HTTP ${response.status}). Verifique se a rota PUT/POST de veículos está implementada no backend.`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.erro ||
            data.message ||
            `Não foi possível ${editando ? "atualizar" : "cadastrar"} o veículo (HTTP ${response.status}).`
        );
      }

      setModalAberto(false);

      setVeiculoEditando(null);

      setMensagem(

        editando

          ? "Veículo atualizado com sucesso."

          : "Veículo cadastrado com sucesso."

      );

      await carregarVeiculos();

    } catch (error) {

      setErroFormulario(

        error.message || "Não foi possível conectar ao servidor."

      );

    } finally {

      setSalvando(false);

    }

  }

  useEffect(() => {

    if (!mensagem) return;

    const temporizador = setTimeout(() => {

      setMensagem("");

    }, 3000);

    return () => clearTimeout(temporizador);

  }, [mensagem]);

  async function excluirVeiculo(veiculo) {

    if (!usuario?.id) {

      setErro("Sua sessão não foi identificada. Entre novamente.");

      setVeiculoParaExcluir(null);

      return;

    }

    setMensagem("");

    setErro("");

    setExcluindoId(veiculo.id_veiculo);

    try {

      const response = await fetch(

        `${API_URL}/veiculos/${veiculo.id_veiculo}`,

        {

          method: "DELETE",

          headers: { "Content-Type": "application/json", Accept: "application/json" },

          body: JSON.stringify({ idCliente: usuario.id }),

        }

      );

      const textoResposta = await response.text();

      let data = {};

      if (textoResposta) {

        try {

          data = JSON.parse(textoResposta);

        } catch {

          if (response.status === 404) {

            throw new Error("A rota de exclusão não foi encontrada no servidor. Verifique se DELETE /veiculos/:idVeiculo está implementada no backend.");

          }

          throw new Error("O servidor retornou uma resposta inesperada. Verifique o backend e tente novamente.");

        }

      }

      if (!response.ok) {

        throw new Error(data.erro || data.message || "Não foi possível excluir o veículo.");

      }

      setVeiculos((atuais) =>

        atuais.filter((item) => item.id_veiculo !== veiculo.id_veiculo)

      );

      setMensagem("Veículo excluído com sucesso.");

      setVeiculoParaExcluir(null);

    } catch (error) {

      setErro(error.message || "Não foi possível conectar ao servidor.");

    } finally {

      setExcluindoId(null);

    }

  }

  return (

    <main className="page-section vehicles-page">

      <div className="container">

        <header className="vehicles-page__header">

          <div>

            <span className="vehicles-page__eyebrow">ÁREA DO CLIENTE</span>

            <h1>Meus veículos</h1>

            <p>

              Gerencie os veículos vinculados à sua conta e mantenha

              seus dados sempre atualizados.

            </p>

          </div>

          <button

            type="button"

            className="button button--primary vehicles-page__add"

            onClick={abrirCadastro}

          >

            <span aria-hidden="true">+</span> Adicionar veículo

          </button>

        </header>

        {mensagem && (

          <div className="vehicles-page__notice vehicles-page__notice--success" role="status">

            {mensagem}

            <button type="button" onClick={() => setMensagem("")} aria-label="Fechar aviso">

              ×

            </button>

          </div>

        )}

        {erro && (

          <div className="vehicles-page__notice vehicles-page__notice--error" role="alert">

            {erro}

            <button type="button" onClick={() => setErro("")} aria-label="Fechar aviso">

              ×

            </button>

          </div>

        )}

        <div className="vehicles-page__summary">

          <div>

            <span className="vehicles-page__summary-label">VEÍCULOS CADASTRADOS</span>

            <strong>{veiculos.length}</strong>

          </div>

          <span className="vehicles-page__summary-icon" aria-hidden="true">
            <img src="../../public/images/carros.png"></img>
          </span>

        </div>

        {carregando ? (

          <div className="vehicles-page__state" role="status">

            Carregando seus veículos...

          </div>

        ) : veiculos.length === 0 ? (

          <section className="vehicles-page__empty">

            <div className="vehicles-page__empty-icon" aria-hidden="true">＋</div>

            <h2>Nenhum veículo cadastrado</h2>

            <p>

              Adicione seu primeiro veículo para facilitar os próximos

              agendamentos na RG Mecânica.

            </p>

            <button

              type="button"

              className="button button--primary"

              onClick={abrirCadastro}

            >

              Cadastrar meu primeiro veículo

            </button>

          </section>

        ) : (

          <section className="vehicles-page__list" aria-label="Veículos cadastrados">

            {veiculos.map((veiculo) => (

              <article className="vehicles-page__card" key={veiculo.id_veiculo}>

                <div className="vehicles-page__card-top">

                  <MarcaLogo marca={veiculo.marca} />

                  <div className="vehicles-page__card-title">

                    <h2>{veiculo.marca} {veiculo.modelo}</h2>

                    <span>{veiculo.ano}</span>

                  </div>

                  <div className="vehicles-page__menu">

                    <button

                      type="button"

                      className="vehicles-page__action"

                      onClick={() => abrirEdicao(veiculo)}

                      aria-label={`Editar ${veiculo.marca} ${veiculo.modelo}`}

                    >

                      Editar

                    </button>

                    <button

                      type="button"

                      className="vehicles-page__action vehicles-page__action--delete"

                      onClick={() => setVeiculoParaExcluir(veiculo)}

                      disabled={excluindoId === veiculo.id_veiculo}

                      aria-label={`Excluir ${veiculo.marca} ${veiculo.modelo}`}

                    >

                      {excluindoId === veiculo.id_veiculo ? "Excluindo..." : "Excluir"}

                    </button>

                  </div>

                </div>

                <div className="vehicles-page__details">

                  <div>

                    <span>PLACA</span>

                    <strong>{veiculo.placa}</strong>

                  </div>

                  <div>

                    <span>QUILOMETRAGEM</span>

                    <strong>

                      {veiculo.quilometragem == null

                        ? "Não informada"

                        : `${Number(veiculo.quilometragem).toLocaleString("pt-BR")} km`}

                    </strong>

                  </div>

                </div>

              </article>

            ))}

          </section>

        )}

      </div>

      {modalAberto && (

        <div

          className="vehicle-modal__overlay"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) fecharModal();

          }}

        >

          <section

            className="vehicle-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="vehicle-modal-title"

          >

            <header className="vehicle-modal__header">

              <div>

                <span className="vehicles-page__eyebrow">

                  {veiculoEditando ? "ATUALIZAÇÃO" : "NOVO CADASTRO"}

                </span>

                <h2 id="vehicle-modal-title">

                  {veiculoEditando ? "Editar veículo" : "Adicionar veículo"}

                </h2>

                <p>Preencha os dados do veículo abaixo.</p>

              </div>

              <button

                type="button"

                className="vehicle-modal__close"

                onClick={fecharModal}

                disabled={salvando}

                aria-label="Fechar modal"

              >

                ×

              </button>

            </header>

            <form className="vehicle-modal__form" onSubmit={salvarVeiculo}>

              <label>

                Marca

                <select name="marca" value={form.marca} onChange={atualizarCampo} required>

                  <option value="">Selecione a marca</option>

                  {Object.keys(MODELOS_POR_MARCA).map((marca) => (

                    <option key={marca} value={marca}>{marca}</option>

                  ))}

                  <option value="__outra__">Outra marca</option>

                </select>

              </label>

              {form.marca && (

                <div className="vehicle-modal__brand-preview">

                  <MarcaLogo marca={form.marca === "__outra__" ? form.marcaPersonalizada : form.marca} grande />

                  <span>{form.marca === "__outra__" ? (form.marcaPersonalizada || "Logo da marca") : form.marca}</span>

                </div>

              )}

              {form.marca === "__outra__" && (

                <label>

                  Nome da marca

                  <input

                    name="marcaPersonalizada"

                    value={form.marcaPersonalizada}

                    onChange={atualizarCampo}

                    placeholder="Digite a marca"

                    maxLength={80}

                    required

                  />

                </label>

              )}

              <label>

                Modelo

                <select

                  name="modelo"

                  value={form.modelo}

                  onChange={atualizarCampo}

                  disabled={!form.marca}

                  required

                >

                  <option value="">{form.marca ? "Selecione o modelo" : "Selecione primeiro a marca"}</option>

                  {(MODELOS_POR_MARCA[form.marca] || []).map((modelo) => (

                    <option key={modelo} value={modelo === "Outro modelo" ? "__outro_modelo__" : modelo}>

                      {modelo}

                    </option>

                  ))}

                  {form.marca === "__outra__" && <option value="__outro_modelo__">Informar modelo</option>}

                </select>

              </label>

              {(form.modelo === "__outro_modelo__" || form.marca === "__outra__") && (

                <label>

                  Nome do modelo

                  <input

                    name="modeloPersonalizado"

                    value={form.modeloPersonalizado}

                    onChange={atualizarCampo}

                    placeholder="Digite o modelo do veículo"

                    maxLength={100}

                    required

                  />

                </label>

              )}

              <div className="vehicle-modal__row">

                <label>

                  Placa

                  <input

                    name="placa"

                    value={form.placa}

                    onChange={atualizarCampo}

                    placeholder="ABC1D23"

                    maxLength={7}

                    autoCapitalize="characters"

                    required

                  />

                </label>

                <label>

                  Ano

                  <input

                    name="ano"

                    type="number"

                    min="1900"

                    max={new Date().getFullYear() + 1}

                    value={form.ano}

                    onChange={atualizarCampo}

                    placeholder="2022"

                    required

                  />

                </label>

              </div>

              <label>

                Quilometragem (km)

                <input

                  name="quilometragem"

                  type="number"

                  min="0"

                  step="0.01"

                  value={form.quilometragem}

                  onChange={atualizarCampo}

                  placeholder="Ex.: 45000"

                />

              </label>

              {erroFormulario && (

                <p className="form-error" role="alert">{erroFormulario}</p>

              )}

              <div className="vehicle-modal__actions">

                <button

                  type="button"

                  className="button button--outline-dark"

                  onClick={fecharModal}

                  disabled={salvando}

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  className="button button--primary"

                  disabled={salvando}

                >

                  {salvando

                    ? "Salvando..."

                    : veiculoEditando

                      ? "Salvar alterações"

                      : "Cadastrar veículo"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}

      {veiculoParaExcluir && (

        <div

          className="vehicle-modal__overlay vehicle-delete-modal__overlay"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget && !excluindoId) {

              setVeiculoParaExcluir(null);

            }

          }}

        >

          <section

            className="vehicle-modal vehicle-delete-modal"

            role="alertdialog"

            aria-modal="true"

            aria-labelledby="vehicle-delete-title"

            aria-describedby="vehicle-delete-description"

          >

            <div className="vehicle-delete-modal__icon" aria-hidden="true">!</div>

            <h2 id="vehicle-delete-title">Excluir veículo?</h2>

            <p id="vehicle-delete-description">

              Tem certeza de que deseja excluir <strong>{veiculoParaExcluir.marca} {veiculoParaExcluir.modelo}</strong>

              {" "}(placa <strong>{veiculoParaExcluir.placa}</strong>)?

            </p>

            <div className="vehicle-modal__actions">

              <button

                type="button"

                className="button button--outline-dark"

                onClick={() => setVeiculoParaExcluir(null)}

                disabled={excluindoId !== null}

              >

                Cancelar

              </button>

              <button

                type="button"

                className="vehicle-delete-modal__confirm"

                onClick={() => excluirVeiculo(veiculoParaExcluir)}

                disabled={excluindoId !== null}

              >

                {excluindoId !== null ? "Excluindo..." : "Sim, excluir veículo"}

              </button>

            </div>

          </section>

        </div>

      )}

    </main>

  );

}

export default MeusVeiculos;
