
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcrypt";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

const normalizarEmail = (email) =>
  email.trim().toLowerCase();

const normalizarPlaca = (placa) =>
  placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const removerCaracteresNaoNumericos = (valor) =>
  valor.replace(/\D/g, "");

app.get("/", (req, res) => {
  res.send("API da RG Mecânica funcionando!");
});

// CADASTRO DE CLIENTE
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
      !nome || !email || !telefone ||
      !dataNascimento || !cpf || !senha
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

    const [clientes] = await pool.execute(
      `SELECT id_cli FROM cliente
       WHERE email_cli = ? OR cpf_cli = ?
       LIMIT 1`,
      [emailNormalizado, cpfNormalizado]
    );

    if (clientes.length > 0) {
      const [emailExistente] = await pool.execute(
        "SELECT id_cli FROM cliente WHERE email_cli = ? LIMIT 1",
        [emailNormalizado]
      );

      if (emailExistente.length > 0) {
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

    const [resultado] = await pool.execute(
      `INSERT INTO cliente
       (nome_cli, email_cli, telefone_cli, data_nasc_cli,
        cpf_cli, senha_cli)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        emailNormalizado,
        telefoneNormalizado,
        dataNascimento,
        cpfNormalizado,
        senhaHash,
      ]
    );

    const [novoCliente] = await pool.execute(
      `SELECT id_cli, nome_cli, email_cli
       FROM cliente WHERE id_cli = ?`,
      [resultado.insertId]
    );

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      cliente: novoCliente[0],
    });
  } catch (erro) {
    console.error("Erro no cadastro:", erro);

    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        erro: "E-mail ou CPF já cadastrado.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios.",
      });
    }

    const emailNormalizado = normalizarEmail(email);

    const [clientes] = await pool.execute(
      `SELECT id_cli, nome_cli, email_cli, senha_cli
       FROM cliente WHERE email_cli = ? LIMIT 1`,
      [emailNormalizado]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        erro: "E-mail não localizado. Cadastre-se para fazer o login.",
        codigo: "EMAIL_NAO_ENCONTRADO",
      });
    }

    const cliente = clientes[0];

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
    console.error("Erro no login:", erro);

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

// CADASTRO DE VEÍCULO
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
      !idCliente || !placa || !marca ||
      !modelo || ano === undefined || ano === null || ano === ""
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
      anoNumero < 1900 ||
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

    const [clientes] = await pool.execute(
      "SELECT id_cli FROM cliente WHERE id_cli = ?",
      [idCliente]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado.",
      });
    }

    const [veiculosExistentes] = await pool.execute(
      "SELECT id_veiculo FROM veiculo WHERE placa = ?",
      [placaNormalizada]
    );

    if (veiculosExistentes.length > 0) {
      return res.status(409).json({
        erro: "Esta placa já está cadastrada.",
      });
    }

    const [resultado] = await pool.execute(
      `INSERT INTO veiculo
       (id_cliente, placa, marca, modelo, ano, quilometragem)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idCliente,
        placaNormalizada,
        marca.trim(),
        modelo.trim(),
        anoNumero,
        quilometragemNumero,
      ]
    );

    const [novoVeiculo] = await pool.execute(
      `SELECT id_veiculo, id_cliente, placa, marca,
              modelo, ano, quilometragem
       FROM veiculo WHERE id_veiculo = ?`,
      [resultado.insertId]
    );

    return res.status(201).json({
      mensagem: "Veículo cadastrado com sucesso!",
      veiculo: novoVeiculo[0],
    });
  } catch (erro) {
    console.error("Erro ao cadastrar veículo:", erro);

    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        erro: "Esta placa já está cadastrada.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

// LISTAR VEÍCULOS DE UM CLIENTE
app.get("/veiculos/:idCliente", async (req, res) => {
  try {
    const { idCliente } = req.params;

    const [veiculos] = await pool.execute(
      `SELECT id_veiculo, id_cliente, placa, marca,
              modelo, ano, quilometragem
       FROM veiculo
       WHERE id_cliente = ?
       ORDER BY id_veiculo DESC`,
      [idCliente]
    );

    return res.status(200).json({ veiculos });
  } catch (erro) {
    console.error("Erro ao listar veículos:", erro);

    return res.status(500).json({
      erro: "Não foi possível carregar os veículos.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});



 // EXCLUIR VEÍCULO
app.delete("/veiculos/:idVeiculo", async (req, res) => {
  try {
    const { idVeiculo } = req.params;
    const { idCliente } = req.body;

    if (!idVeiculo || !idCliente) {
      return res.status(400).json({
        erro: "Dados do veículo não informados.",
      });
    }

    const [resultado] = await pool.execute(
      `DELETE FROM veiculo
       WHERE id_veiculo = ? AND id_cliente = ?`,
      [idVeiculo, idCliente]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    return res.status(200).json({
      mensagem: "Veículo excluído com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao excluir veículo:", erro);

    if (erro.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        erro: "Este veículo possui agendamentos vinculados e não pode ser excluído.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao excluir o veículo.",
    });
  }
});

app.put("/veiculos/:idVeiculo", async (req, res) => {
  console.log("PUT /veiculos chamado!");
  console.log("ID do veículo:", req.params.idVeiculo);
  console.log("Dados recebidos:", req.body);
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

    const [resultado] = await pool.execute(
      `UPDATE veiculo
       SET placa = ?, marca = ?, modelo = ?, ano = ?, quilometragem = ?
       WHERE id_veiculo = ? AND id_cliente = ?`,
      [
        placa,
        marca,
        modelo,
        ano,
        quilometragem ?? null,
        idVeiculo,
        idCliente,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    return res.status(200).json({
      mensagem: "Veículo atualizado com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao atualizar veículo:", erro);

    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        erro: "Já existe um veículo cadastrado com essa placa.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao atualizar o veículo.",
    });
  }
});

///////////////////////////////////////////////////////
// AGENDAMENTO
//////////////////////////////////////////////////////
app.get("/servicos", async (req, res) => {
  try {
    const [servicos] = await pool.execute(`
      SELECT
        id_servico,
        nome_serv,
        desc_serv,
        duracao_serv
      FROM servico
      WHERE status_serv = TRUE
      ORDER BY nome_serv
    `);

    return res.status(200).json({ servicos });
  } catch (erro) {
    console.error("Erro ao buscar serviços:", erro);

    return res.status(500).json({
      erro: "Não foi possível carregar os serviços.",
    });
  }
});


// POST /agendamentos
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
      !idCliente ||
      !idVeiculo ||
      !idServico ||
      !dataAgend ||
      !horarioAgend
    ) {
      return res.status(400).json({
        erro: "Preencha veículo, serviço, data e horário.",
      });
    }

    // Validar o formato da data e do horário
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dataAgend) ||
      !/^\d{2}:\d{2}(:\d{2})?$/.test(horarioAgend)
    ) {
      return res.status(400).json({
        erro: "Data ou horário inválido.",
      });
    }

    const dataEscolhida = new Date(`${dataAgend}T00:00:00`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(dataEscolhida.getTime()) ||
      dataEscolhida.toISOString().slice(0, 10) !== dataAgend ||
      dataEscolhida < hoje
    ) {
      return res.status(400).json({
        erro: "Selecione uma data válida, a partir de hoje.",
      });
    }

    // Confirmar que o veículo pertence ao cliente
    const [veiculos] = await pool.execute(
      `SELECT id_veiculo
       FROM veiculo
       WHERE id_veiculo = ? AND id_cliente = ?`,
      [idVeiculo, idCliente]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({
        erro: "Veículo não encontrado para esta conta.",
      });
    }

    // Confirmar que o serviço existe e está ativo
    const [servicos] = await pool.execute(
      `SELECT id_servico
       FROM servico
       WHERE id_servico = ? AND status_serv = TRUE`,
      [idServico]
    );

    if (servicos.length === 0) {
      return res.status(404).json({
        erro: "Serviço não encontrado ou indisponível.",
      });
    }

    // Impedir duas solicitações no mesmo horário
    const [conflitos] = await pool.execute(
      `SELECT id_agend
       FROM agendamento
       WHERE data_agend = ?
         AND horario_agend = ?
         AND status_agend IN ('SOLICITADO', 'CONFIRMADO')
       LIMIT 1`,
      [dataAgend, horarioAgend]
    );

    if (conflitos.length > 0) {
      return res.status(409).json({
        erro: "Esse horário já possui uma solicitação ou agendamento confirmado.",
      });
    }

    const [resultado] = await pool.execute(
      `INSERT INTO agendamento (
        id_cliente,
        id_veiculo,
        id_servico,
        data_agend,
        horario_agend,
        status_agend,
        observacao
      ) VALUES (?, ?, ?, ?, ?, 'SOLICITADO', ?)`,
      [
        idCliente,
        idVeiculo,
        idServico,
        dataAgend,
        horarioAgend,
        observacao?.trim() || null,
      ]
    );

    return res.status(201).json({
      mensagem: "Agendamento solicitado com sucesso!",
      id_agend: resultado.insertId,
      status: "SOLICITADO",
    });
  } catch (erro) {
    console.error("Erro ao criar agendamento:", erro);

    return res.status(500).json({
      erro: "Erro interno ao solicitar o agendamento.",
    });
  }
});



app.get("/agendamentos/cliente/:idCliente", async (req, res) => {
  try {
    const { idCliente } = req.params;

    if (!Number.isInteger(Number(idCliente)) || Number(idCliente) <= 0) {
      return res.status(400).json({
        erro: "Identificador do cliente inválido.",
      });
    }

    const [agendamentos] = await pool.execute(
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
      WHERE a.id_cliente = ?
      ORDER BY a.data_agend DESC, a.horario_agend DESC`,
      [Number(idCliente)]
    );

    return res.status(200).json({ agendamentos });
  } catch (erro) {
    console.error("Erro ao consultar agendamentos:", erro);

    return res.status(500).json({
      erro: "Não foi possível carregar seus agendamentos.",
    });
  }
});


//////////////////////////////////////////
//// HISTÓRICO
/////////////////////////////////////////


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

    const condicoes = ["a.id_cliente = ?"];
    const parametros = [idCliente];

    if (veiculo && veiculo !== "todos") {
      condicoes.push("v.id_veiculo = ?");
      parametros.push(Number(veiculo));
    }

    if (servico && servico !== "todos") {
      condicoes.push("COALESCE(at.id_servico, a.id_servico) = ?");
      parametros.push(Number(servico));
    }

    if (valorMin !== undefined && valorMin !== "") {
      condicoes.push("at.valor_servico >= ?");
      parametros.push(Number(valorMin));
    }

    if (valorMax !== undefined && valorMax !== "") {
      condicoes.push("at.valor_servico <= ?");
      parametros.push(Number(valorMax));
    }

    if (periodo === "30") {
      condicoes.push("at.data_inicio_atend >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    } else if (periodo === "365") {
      condicoes.push("at.data_inicio_atend >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)");
    }

    if (busca && busca.trim()) {
      condicoes.push(
        "(s.nome_serv LIKE ? OR at.observacao LIKE ? OR at.motivo LIKE ? OR v.placa LIKE ? OR v.modelo LIKE ?)"
      );

      const termo = `%${busca.trim()}%`;
      parametros.push(termo, termo, termo, termo, termo);
    }

    let ordenacao = "at.data_inicio_atend DESC";

    if (ordemValor === "menor") {
      ordenacao = "at.valor_servico IS NULL, at.valor_servico ASC";
    } else if (ordemValor === "maior") {
      ordenacao = "at.valor_servico IS NULL, at.valor_servico DESC";
    }

    const [historico] = await pool.execute(
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
    console.error("Erro ao consultar histórico:", erro);

    return res.status(500).json({
      erro: "Não foi possível carregar o histórico de serviços.",
    });
  }
});
