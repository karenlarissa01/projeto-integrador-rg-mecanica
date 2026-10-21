
import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcrypt";
import { pool } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

const normalizarEmail = (email) =>
  email.trim().toLowerCase();

const normalizarPlaca = (placa) =>
  placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const removerCaracteresNaoNumericos = (valor) =>
  valor.replace(/\D/g, "");

const idValido = (valor) =>
  Number.isInteger(Number(valor)) && Number(valor) > 0;

const erroBanco = (erro) => {
  console.error("Erro PostgreSQL:", {
    code: erro.code,
    message: erro.message,
    constraint: erro.constraint,
  });
};

const validarData = (data) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataTeste = new Date(ano, mes - 1, dia);

  return (
    dataTeste.getFullYear() === ano &&
    dataTeste.getMonth() === mes - 1 &&
    dataTeste.getDate() === dia
  );
};

const dataLocalISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const validarHorario = (horario) => {
  const correspondencia = horario.match(
    /^(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!correspondencia) {
    return false;
  }

  const horas = Number(correspondencia[1]);
  const minutos = Number(correspondencia[2]);
  const segundos = Number(correspondencia[3] || 0);

  return (
    horas >= 0 &&
    horas <= 23 &&
    minutos >= 0 &&
    minutos <= 59 &&
    segundos >= 0 &&
    segundos <= 59
  );
};

/* =====================================================
   ROTA INICIAL
===================================================== */

app.get("/", (req, res) => {
  res.send("API da RG Mecânica funcionando!");
});

/* =====================================================
   CADASTRO DE CLIENTE
===================================================== */

app.post("/cadastro", async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      dataNascimento,
      cpf,
      senha,
    } = req.body;

    if (
      typeof nome !== "string" ||
      typeof email !== "string" ||
      typeof telefone !== "string" ||
      typeof dataNascimento !== "string" ||
      typeof cpf !== "string" ||
      typeof senha !== "string" ||
      !nome.trim() ||
      !email.trim() ||
      !telefone.trim() ||
      !dataNascimento.trim() ||
      !cpf.trim() ||
      !senha
    ) {
      return res.status(400).json({
        erro: "Todos os campos são obrigatórios.",
      });
    }

    const emailNormalizado = normalizarEmail(email);
    const telefoneNormalizado =
      removerCaracteresNaoNumericos(telefone);
    const cpfNormalizado =
      removerCaracteresNaoNumericos(cpf);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      return res.status(400).json({
        erro: "Informe um e-mail válido.",
      });
    }

    if (cpfNormalizado.length !== 11) {
      return res.status(400).json({
        erro: "O CPF deve possuir 11 dígitos.",
      });
    }

    if (!validarData(dataNascimento)) {
      return res.status(400).json({
        erro: "Informe uma data de nascimento válida.",
      });
    }

    if (dataNascimento >= dataLocalISO()) {
      return res.status(400).json({
        erro: "A data de nascimento deve ser anterior à data atual.",
      });
    }

    if (telefoneNormalizado.length < 10 ||
        telefoneNormalizado.length > 13) {
      return res.status(400).json({
        erro: "Informe um telefone válido.",
      });
    }

    if (senha.length < 8) {
      return res.status(400).json({
        erro: "A senha deve possuir pelo menos 8 caracteres.",
      });
    }

    const consultaExistente = await pool.query(
      `SELECT email_cli, cpf_cli
       FROM cliente
       WHERE email_cli = $1 OR cpf_cli = $2
       LIMIT 1`,
      [emailNormalizado, cpfNormalizado]
    );

    const existente = consultaExistente.rows[0];

    if (existente) {
      if (existente.email_cli === emailNormalizado) {
        return res.status(409).json({
          erro: "E-mail já cadastrado.",
        });
      }

      return res.status(409).json({
        erro: "CPF já cadastrado.",
      });
    }

    const senhaHash = await bcrypt.hash(
      senha,
      BCRYPT_SALT_ROUNDS
    );

    const resultado = await pool.query(
      `INSERT INTO cliente (
        nome_cli,
        email_cli,
        telefone_cli,
        data_nasc_cli,
        cpf_cli,
        senha_cli
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_cli, nome_cli, email_cli`,
      [
        nome.trim(),
        emailNormalizado,
        telefoneNormalizado,
        dataNascimento,
        cpfNormalizado,
        senhaHash,
      ]
    );

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      cliente: resultado.rows[0],
    });
  } catch (erro) {
    erroBanco(erro);

    if (erro.code === "23505") {
      return res.status(409).json({
        erro: "E-mail ou CPF já cadastrado.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

/* =====================================================
   LOGIN DO CLIENTE
===================================================== */

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios.",
      });
    }

    const emailNormalizado = normalizarEmail(email);

    const resultado = await pool.query(
      `SELECT id_cli, nome_cli, email_cli, senha_cli
       FROM cliente
       WHERE email_cli = $1
       LIMIT 1`,
      [emailNormalizado]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: "E-mail não localizado. Cadastre-se para fazer o login.",
        codigo: "EMAIL_NAO_ENCONTRADO",
      });
    }

    const cliente = resultado.rows[0];

    const senhaCorreta = await bcrypt.compare(
      senha,
      cliente.senha_cli
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "Senha inválida!",
        codigo: "SENHA_INVALIDA",
      });
    }

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      cliente: {
        id: cliente.id_cli,
        nome: cliente.nome_cli,
        email: cliente.email_cli,
      },
    });
  } catch (erro) {
    erroBanco(erro);

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

/* =====================================================
   CADASTRO DE VEÍCULO
===================================================== */

app.post("/veiculos", async (req, res) => {
  try {
    const {
      idCliente,
      placa,
      marca,
      modelo,
      ano,
      quilometragem,
    } = req.body;

    if (
      !idValido(idCliente) ||
      typeof placa !== "string" ||
      typeof marca !== "string" ||
      typeof modelo !== "string" ||
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      ano === undefined ||
      ano === null ||
      ano === ""
    ) {
      return res.status(400).json({
        erro: "Preencha todos os campos obrigatórios.",
      });
    }

    const placaNormalizada = normalizarPlaca(placa);

    if (placaNormalizada.length !== 7) {
      return res.status(400).json({
        erro: "A placa deve possuir 7 caracteres.",
      });
    }

    const anoNumero = Number(ano);
    const anoAtual = new Date().getFullYear();

    if (
      !Number.isInteger(anoNumero) ||
      anoNumero < 1886 ||
      anoNumero > anoAtual + 1
    ) {
      return res.status(400).json({
        erro: "Informe um ano válido.",
      });
    }

    let quilometragemNumero = null;

    if (
      quilometragem !== "" &&
      quilometragem !== null &&
      quilometragem !== undefined
    ) {
      quilometragemNumero = Number(quilometragem);

      if (
        !Number.isFinite(quilometragemNumero) ||
        quilometragemNumero < 0
      ) {
        return res.status(400).json({
          erro: "Informe uma quilometragem válida.",
        });
      }
    }

    const cliente = await pool.query(
      "SELECT id_cli FROM cliente WHERE id_cli = $1",
      [Number(idCliente)]
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado.",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO veiculo (
        id_cliente,
        placa,
        marca,
        modelo,
        ano,
        quilometragem
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id_veiculo,
        id_cliente,
        placa,
        marca,
        modelo,
        ano,
        quilometragem`,
      [
        Number(idCliente),
        placaNormalizada,
        marca.trim(),
        modelo.trim(),
        anoNumero,
        quilometragemNumero,
      ]
    );

    return res.status(201).json({
      mensagem: "Veículo cadastrado com sucesso!",
      veiculo: resultado.rows[0],
    });
  } catch (erro) {
    erroBanco(erro);

    if (erro.code === "23505") {
      return res.status(409).json({
        erro: "Esta placa já está cadastrada.",
      });
    }

    if (erro.code === "23503") {
      return res.status(404).json({
        erro: "Cliente não encontrado.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

/* =====================================================
   LISTAR VEÍCULOS DE UM CLIENTE
===================================================== */

app.get("/veiculos/:idCliente", async (req, res) => {
  try {
    const { idCliente } = req.params;

    if (!idValido(idCliente)) {
      return res.status(400).json({
        erro: "Identificador do cliente inválido.",
      });
    }

    const resultado = await pool.query(
      `SELECT
        id_veiculo,
        id_cliente,
        placa,
        marca,
        modelo,
        ano,
        quilometragem
      FROM veiculo
      WHERE id_cliente = $1
      ORDER BY id_veiculo DESC`,
      [Number(idCliente)]
    );

    return res.status(200).json({
      veiculos: resultado.rows,
    });
  } catch (erro) {
    erroBanco(erro);

    return res.status(500).json({
      erro: "Não foi possível carregar os veículos.",
    });
  }
});

/* =====================================================
   EXCLUIR VEÍCULO
===================================================== */

app.delete("/veiculos/:idVeiculo", async (req, res) => {
  try {
    const { idVeiculo } = req.params;
    const { idCliente } = req.body;

    if (!idValido(idVeiculo) || !idValido(idCliente)) {
      return res.status(400).json({
        erro: "Dados do veículo não informados ou inválidos.",
      });
    }

    const resultado = await pool.query(
      `DELETE FROM veiculo
       WHERE id_veiculo = $1
         AND id_cliente = $2
       RETURNING id_veiculo`,
      [Number(idVeiculo), Number(idCliente)]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    return res.status(200).json({
      mensagem: "Veículo excluído com sucesso!",
    });
  } catch (erro) {
    erroBanco(erro);

    if (erro.code === "23503") {
      return res.status(409).json({
        erro: "Este veículo possui agendamentos vinculados e não pode ser excluído.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao excluir o veículo.",
    });
  }
});

/* =====================================================
   ATUALIZAR VEÍCULO
===================================================== */

app.put("/veiculos/:idVeiculo", async (req, res) => {
  try {
    const { idVeiculo } = req.params;

    const {
      idCliente,
      placa,
      marca,
      modelo,
      ano,
      quilometragem,
    } = req.body;

    if (
      !idValido(idVeiculo) ||
      !idValido(idCliente) ||
      typeof placa !== "string" ||
      typeof marca !== "string" ||
      typeof modelo !== "string" ||
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      ano === undefined ||
      ano === null ||
      ano === ""
    ) {
      return res.status(400).json({
        erro: "Preencha corretamente os dados do veículo.",
      });
    }

    const placaNormalizada = normalizarPlaca(placa);
    const anoNumero = Number(ano);
    const anoAtual = new Date().getFullYear();

    if (placaNormalizada.length !== 7) {
      return res.status(400).json({
        erro: "A placa deve possuir 7 caracteres.",
      });
    }

    if (
      !Number.isInteger(anoNumero) ||
      anoNumero < 1886 ||
      anoNumero > anoAtual + 1
    ) {
      return res.status(400).json({
        erro: "Informe um ano válido.",
      });
    }

    let quilometragemNumero = null;

    if (
      quilometragem !== "" &&
      quilometragem !== null &&
      quilometragem !== undefined
    ) {
      quilometragemNumero = Number(quilometragem);

      if (
        !Number.isFinite(quilometragemNumero) ||
        quilometragemNumero < 0
      ) {
        return res.status(400).json({
          erro: "Informe uma quilometragem válida.",
        });
      }
    }

    const resultado = await pool.query(
      `UPDATE veiculo
       SET placa = $1,
           marca = $2,
           modelo = $3,
           ano = $4,
           quilometragem = $5
       WHERE id_veiculo = $6
         AND id_cliente = $7
       RETURNING
         id_veiculo,
         id_cliente,
         placa,
         marca,
         modelo,
         ano,
         quilometragem`,
      [
        placaNormalizada,
        marca.trim(),
        modelo.trim(),
        anoNumero,
        quilometragemNumero,
        Number(idVeiculo),
        Number(idCliente),
      ]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    return res.status(200).json({
      mensagem: "Veículo atualizado com sucesso!",
      veiculo: resultado.rows[0],
    });
  } catch (erro) {
    erroBanco(erro);

    if (erro.code === "23505") {
      return res.status(409).json({
        erro: "Já existe um veículo cadastrado com essa placa.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao atualizar o veículo.",
    });
  }
});

/* =====================================================
   LISTAR SERVIÇOS
===================================================== */

app.get("/servicos", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        id_servico,
        nome_serv,
        desc_serv,
        duracao_serv
      FROM servico
      WHERE status_serv = TRUE
      ORDER BY nome_serv`
    );

    return res.status(200).json({
      servicos: resultado.rows,
    });
  } catch (erro) {
    erroBanco(erro);

    return res.status(500).json({
      erro: "Não foi possível carregar os serviços.",
    });
  }
});

/* =====================================================
   CRIAR AGENDAMENTO
===================================================== */

app.post("/agendamentos", async (req, res) => {
  try {
    const {
      idCliente,
      idVeiculo,
      idServico,
      dataAgend,
      horarioAgend,
      observacao,
    } = req.body;

    if (
      !idValido(idCliente) ||
      !idValido(idVeiculo) ||
      !idValido(idServico) ||
      typeof dataAgend !== "string" ||
      typeof horarioAgend !== "string" ||
      !dataAgend ||
      !horarioAgend
    ) {
      return res.status(400).json({
        erro: "Preencha veículo, serviço, data e horário corretamente.",
      });
    }

    if (!validarData(dataAgend) || !validarHorario(horarioAgend)) {
      return res.status(400).json({
        erro: "Data ou horário inválido.",
      });
    }

    if (dataAgend < dataLocalISO()) {
      return res.status(400).json({
        erro: "Selecione uma data a partir de hoje.",
      });
    }

    if (
      observacao !== undefined &&
      observacao !== null &&
      typeof observacao !== "string"
    ) {
      return res.status(400).json({
        erro: "A observação deve ser um texto.",
      });
    }

    const veiculo = await pool.query(
      `SELECT id_veiculo
       FROM veiculo
       WHERE id_veiculo = $1
         AND id_cliente = $2`,
      [Number(idVeiculo), Number(idCliente)]
    );

    if (veiculo.rows.length === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    const servico = await pool.query(
      `SELECT id_servico
       FROM servico
       WHERE id_servico = $1
         AND status_serv = TRUE`,
      [Number(idServico)]
    );

    if (servico.rows.length === 0) {
      return res.status(404).json({
        erro: "Serviço não encontrado ou indisponível.",
      });
    }

    const conflito = await pool.query(
      `SELECT id_agend
       FROM agendamento
       WHERE data_agend = $1
         AND horario_agend = $2
         AND status_agend IN ('SOLICITADO', 'CONFIRMADO')
       LIMIT 1`,
      [dataAgend, horarioAgend]
    );

    if (conflito.rows.length > 0) {
      return res.status(409).json({
        erro: "Esse horário já possui uma solicitação ou agendamento confirmado.",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO agendamento (
        id_cliente,
        id_veiculo,
        id_servico,
        data_agend,
        horario_agend,
        status_agend,
        observacao
      )
      VALUES ($1, $2, $3, $4, $5, 'SOLICITADO', $6)
      RETURNING id_agend, status_agend`,
      [
        Number(idCliente),
        Number(idVeiculo),
        Number(idServico),
        dataAgend,
        horarioAgend,
        observacao?.trim() || null,
      ]
    );

    return res.status(201).json({
      mensagem: "Agendamento solicitado com sucesso!",
      id_agend: resultado.rows[0].id_agend,
      status: resultado.rows[0].status_agend,
    });
  } catch (erro) {
    erroBanco(erro);

    if (erro.code === "23503") {
      return res.status(400).json({
        erro: "Cliente, veículo ou serviço informado é inválido.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao solicitar o agendamento.",
    });
  }
});

/* =====================================================
   LISTAR AGENDAMENTOS DO CLIENTE
===================================================== */

app.get("/agendamentos/cliente/:idCliente", async (req, res) => {
  try {
    const { idCliente } = req.params;

    if (!idValido(idCliente)) {
      return res.status(400).json({
        erro: "Identificador do cliente inválido.",
      });
    }

    const resultado = await pool.query(
      `SELECT
        a.id_agend,
        a.data_agend,
        a.horario_agend,
        a.status_agend,
        a.observacao,
        s.nome_serv,
        v.marca,
        v.modelo,
        v.placa
      FROM agendamento a
      INNER JOIN servico s
        ON s.id_servico = a.id_servico
      INNER JOIN veiculo v
        ON v.id_veiculo = a.id_veiculo
      WHERE a.id_cliente = $1
      ORDER BY a.data_agend DESC, a.horario_agend DESC`,
      [Number(idCliente)]
    );

    return res.status(200).json({
      agendamentos: resultado.rows,
    });
  } catch (erro) {
    erroBanco(erro);

    return res.status(500).json({
      erro: "Não foi possível carregar seus agendamentos.",
    });
  }
});

/* =====================================================
   HISTÓRICO DE SERVIÇOS
===================================================== */

app.get("/historico/cliente/:idCliente", async (req, res) => {
  try {
    const idCliente = Number(req.params.idCliente);

    const {
      veiculo,
      servico,
      valorMin,
      valorMax,
      ordemValor,
      periodo,
      busca,
    } = req.query;

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      return res.status(400).json({
        erro: "Identificador do cliente inválido.",
      });
    }

    const condicoes = ["a.id_cliente = $1"];
    const parametros = [idCliente];

    const adicionarParametro = (valor) => {
      parametros.push(valor);
      return `$${parametros.length}`;
    };

    if (veiculo && veiculo !== "todos") {
      if (!idValido(veiculo)) {
        return res.status(400).json({
          erro: "Filtro de veículo inválido.",
        });
      }

      condicoes.push(
        `v.id_veiculo = ${adicionarParametro(Number(veiculo))}`
      );
    }

    if (servico && servico !== "todos") {
      if (!idValido(servico)) {
        return res.status(400).json({
          erro: "Filtro de serviço inválido.",
        });
      }

      condicoes.push(
        `COALESCE(at.id_servico, a.id_servico) = ${adicionarParametro(Number(servico))}`
      );
    }

    if (valorMin !== undefined && valorMin !== "") {
      const minimo = Number(valorMin);

      if (!Number.isFinite(minimo) || minimo < 0) {
        return res.status(400).json({
          erro: "Valor mínimo inválido.",
        });
      }

      condicoes.push(
        `at.valor_servico >= ${adicionarParametro(minimo)}`
      );
    }

    if (valorMax !== undefined && valorMax !== "") {
      const maximo = Number(valorMax);

      if (!Number.isFinite(maximo) || maximo < 0) {
        return res.status(400).json({
          erro: "Valor máximo inválido.",
        });
      }

      if (
        valorMin !== undefined &&
        valorMin !== "" &&
        maximo < Number(valorMin)
      ) {
        return res.status(400).json({
          erro: "O valor máximo não pode ser menor que o mínimo.",
        });
      }

      condicoes.push(
        `at.valor_servico <= ${adicionarParametro(maximo)}`
      );
    }

    if (periodo === "30") {
      condicoes.push(
        "at.data_inicio_atend >= CURRENT_DATE - INTERVAL '30 days'"
      );
    } else if (periodo === "365") {
      condicoes.push(
        "at.data_inicio_atend >= CURRENT_DATE - INTERVAL '365 days'"
      );
    }

    if (busca && busca.trim()) {
      const termo = `%${busca.trim()}%`;

      const p1 = adicionarParametro(termo);
      const p2 = adicionarParametro(termo);
      const p3 = adicionarParametro(termo);
      const p4 = adicionarParametro(termo);
      const p5 = adicionarParametro(termo);

      condicoes.push(
        `(s.nome_serv ILIKE ${p1}
          OR at.observacao ILIKE ${p2}
          OR at.motivo ILIKE ${p3}
          OR v.placa ILIKE ${p4}
          OR v.modelo ILIKE ${p5})`
      );
    }

    let ordenacao = "at.data_inicio_atend DESC";

    if (ordemValor === "menor") {
      ordenacao = "at.valor_servico ASC NULLS LAST";
    } else if (ordemValor === "maior") {
      ordenacao = "at.valor_servico DESC NULLS LAST";
    }

    const resultado = await pool.query(
      `SELECT
        at.id_atend,
        at.data_inicio_atend,
        at.data_fim_atend,
        at.observacao,
        at.motivo,
        at.valor_servico,
        s.nome_serv,
        s.desc_serv,
        v.id_veiculo,
        v.marca,
        v.modelo,
        v.placa
      FROM atendimento at
      INNER JOIN agendamento a
        ON a.id_agend = at.id_agend
      INNER JOIN veiculo v
        ON v.id_veiculo = a.id_veiculo
      LEFT JOIN servico s
        ON s.id_servico = COALESCE(at.id_servico, a.id_servico)
      WHERE ${condicoes.join(" AND ")}
      ORDER BY ${ordenacao}`,
      parametros
    );

    const historico = resultado.rows;

    const totalGasto = historico.reduce(
      (total, item) => total + Number(item.valor_servico || 0),
      0
    );

    return res.status(200).json({
      historico,
      resumo: {
        totalAtendimentos: historico.length,
        totalGasto,
      },
    });
  } catch (erro) {
    erroBanco(erro);

    return res.status(500).json({
      erro: "Não foi possível carregar o histórico de serviços.",
    });
  }
});

/* =====================================================
   INICIAR SERVIDOR
===================================================== */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
