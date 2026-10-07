import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const BCRYPT_SALT_ROUNDS = 10;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors());
app.use(express.json());

const normalizarEmail = (email) =>
  email.trim().toLowerCase();

const normalizarPlaca = (placa) =>
  placa
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

const removerCaracteresNaoNumericos = (valor) =>
  valor.replace(/\D/g, "");

app.get("/", (req, res) => {
  res.send("API da RG Mecânica funcionando!");
});

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
      !nome ||
      !email ||
      !telefone ||
      !dataNascimento ||
      !cpf ||
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

    const {
      data: clienteEmail,
      error: emailError,
    } = await supabase
      .from("cliente")
      .select("id_cli")
      .eq("email_cli", emailNormalizado)
      .maybeSingle();

    if (emailError) {
      console.error(
        "Erro ao verificar e-mail:",
        emailError
      );

      return res.status(500).json({
        erro: "Erro ao verificar o e-mail.",
      });
    }

    if (clienteEmail) {
      return res.status(409).json({
        erro: "E-mail já cadastrado.",
      });
    }

    const {
      data: clienteCpf,
      error: cpfError,
    } = await supabase
      .from("cliente")
      .select("id_cli")
      .eq("cpf_cli", cpfNormalizado)
      .maybeSingle();

    if (cpfError) {
      console.error(
        "Erro ao verificar CPF:",
        cpfError
      );

      return res.status(500).json({
        erro: "Erro ao verificar o CPF.",
      });
    }

    if (clienteCpf) {
      return res.status(409).json({
        erro: "CPF já cadastrado.",
      });
    }

    const senhaHash = await bcrypt.hash(
      senha,
      BCRYPT_SALT_ROUNDS
    );

    const {
      data: cliente,
      error: cadastroError,
    } = await supabase
      .from("cliente")
      .insert({
        nome_cli: nome.trim(),
        email_cli: emailNormalizado,
        telefone_cli: telefoneNormalizado,
        data_nasc_cli: dataNascimento,
        cpf_cli: cpfNormalizado,
        senha_hash: senhaHash,
      })
      .select("id_cli, nome_cli, email_cli")
      .single();

    if (cadastroError) {
      console.error(
        "Erro ao cadastrar cliente:",
        cadastroError
      );

      return res.status(500).json({
        erro: "Não foi possível cadastrar o cliente.",
      });
    }

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      cliente,
    });
  } catch (erro) {
    console.error(
      "Erro inesperado no cadastro:",
      erro
    );

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios.",
      });
    }

    const emailNormalizado = normalizarEmail(email);

    const {
      data: cliente,
      error: clienteError,
    } = await supabase
      .from("cliente")
      .select(
        "id_cli, nome_cli, email_cli, senha_hash"
      )
      .eq("email_cli", emailNormalizado)
      .maybeSingle();

    if (clienteError) {
      console.error(
        "Erro ao buscar cliente:",
        clienteError
      );

      return res.status(500).json({
        erro: "Não foi possível realizar o login.",
      });
    }

    if (!cliente) {
      return res.status(404).json({
        erro: "E-mail não localizado. Cadastre-se para fazer o login.",
        codigo: "EMAIL_NAO_ENCONTRADO",
      });
    }

    if (!cliente.senha_hash) {
      return res.status(401).json({
        erro: "Este usuário não possui uma senha cadastrada.",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      cliente.senha_hash
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
    console.error(
      "Erro inesperado no login:",
      erro
    );

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

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
      !idCliente ||
      !placa ||
      !marca ||
      !modelo ||
      !ano
    ) {
      return res.status(400).json({
        erro: "Preencha todos os campos obrigatórios.",
      });
    }

    const placaNormalizada =
      normalizarPlaca(placa);

    if (placaNormalizada.length !== 7) {
      return res.status(400).json({
        erro: "A placa deve possuir 7 caracteres.",
      });
    }

    const anoNumero = Number(ano);
    const anoAtual = new Date().getFullYear();

    if (
      Number.isNaN(anoNumero) ||
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
      quilometragemNumero =
        Number(quilometragem);

      if (
        Number.isNaN(quilometragemNumero) ||
        quilometragemNumero < 0
      ) {
        return res.status(400).json({
          erro: "Informe uma quilometragem válida.",
        });
      }
    }

    const {
      data: placaExistente,
      error: placaError,
    } = await supabase
      .from("veiculo")
      .select("id_veiculo")
      .eq("placa", placaNormalizada)
      .maybeSingle();

    if (placaError) {
      console.error(
        "Erro ao verificar placa:",
        placaError
      );

      return res.status(500).json({
        erro: "Erro ao verificar a placa.",
      });
    }

    if (placaExistente) {
      return res.status(409).json({
        erro: "Esta placa já está cadastrada.",
      });
    }

    const {
      data: veiculo,
      error: cadastroError,
    } = await supabase
      .from("veiculo")
      .insert({
        id_cliente: idCliente,
        placa: placaNormalizada,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: anoNumero,
        quilometragem: quilometragemNumero,
      })
      .select(
        "id_veiculo, id_cliente, placa, marca, modelo, ano, quilometragem"
      )
      .single();

    if (cadastroError) {
      console.error(
        "Erro ao cadastrar veículo:",
        cadastroError
      );

      return res.status(500).json({
        erro: "Não foi possível cadastrar o veículo.",
      });
    }

    return res.status(201).json({
      mensagem: "Veículo cadastrado com sucesso!",
      veiculo,
    });
  } catch (erro) {
    console.error(
      "Erro inesperado ao cadastrar veículo:",
      erro
    );

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

app.get(
  "/veiculos/:idCliente",
  async (req, res) => {
    try {
      const { idCliente } = req.params;

      const {
        data: veiculos,
        error,
      } = await supabase
        .from("veiculo")
        .select(
          "id_veiculo, id_cliente, placa, marca, modelo, ano, quilometragem"
        )
        .eq("id_cliente", idCliente)
        .order(
          "id_veiculo",
          { ascending: false }
        );

      if (error) {
        console.error(
          "Erro ao buscar veículos:",
          error
        );

        return res.status(500).json({
          erro: "Não foi possível carregar os veículos.",
        });
      }

      return res.status(200).json({
        veiculos,
      });
    } catch (erro) {
      console.error(
        "Erro inesperado ao listar veículos:",
        erro
      );

      return res.status(500).json({
        erro: "Erro interno do servidor.",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});