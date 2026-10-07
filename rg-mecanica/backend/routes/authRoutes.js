import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica os campos
    if (!email || !password) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios.",
      });
    }

    // Procura o cliente pelo e-mail
    const [users] = await pool.query(
      `SELECT
        id_cli,
        nome_cli,
        email_cli,
        senha_cli,
        cpf_cli,
        telefone_cli
       FROM cliente
       WHERE email_cli = ?`,
      [email]
    );

    // Usuário não encontrado
    if (users.length === 0) {
      return res.status(401).json({
        message: "E-mail ou senha incorretos.",
      });
    }

    const user = users[0];

    // Compara a senha digitada com o hash do banco
    const passwordCorrect = await bcrypt.compare(
      password,
      user.senha_cli
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "E-mail ou senha incorretos.",
      });
    }

    // Login realizado
    return res.status(200).json({
      message: "Login realizado com sucesso!",
      user: {
        id: user.id_cli,
        nome: user.nome_cli,
        email: user.email_cli,
        cpf: user.cpf_cli,
        telefone: user.telefone_cli,
      },
    });

  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return res.status(500).json({
      message: "Erro interno ao realizar login.",
    });
  }
});

export default router;