import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      name,
      birthDate,
      cpf,
      email,
      phone,
      password,
    } = req.body;

    // Verifica se todos os campos foram enviados
    if (
      !name ||
      !birthDate ||
      !cpf ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        message: "Todos os campos são obrigatórios.",
      });
    }

    // Remove pontos e hífen do CPF
    const cpfLimpo = cpf.replace(/\D/g, "");

    // Verifica se o CPF possui 11 números
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        message: "CPF inválido.",
      });
    }

    // Verifica se o e-mail já existe
    const [existingEmail] = await pool.query(
      "SELECT id_cli FROM cliente WHERE email_cli = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        message: "Este e-mail já está cadastrado.",
      });
    }

    // Verifica se o CPF já existe
    const [existingCpf] = await pool.query(
      "SELECT id_cli FROM cliente WHERE cpf_cli = ?",
      [cpfLimpo]
    );

    if (existingCpf.length > 0) {
      return res.status(409).json({
        message: "Este CPF já está cadastrado.",
      });
    }

    // Verifica idade
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
      return res.status(400).json({
        message:
          "É preciso ser maior de idade para criar uma conta.",
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(password, 10);

    // Salva o cliente
    const [result] = await pool.query(
      `INSERT INTO cliente
      (
        nome_cli,
        email_cli,
        telefone_cli,
        data_nasc_cli,
        senha_cli,
        cpf_cli
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone,
        birthDate,
        senhaHash,
        cpfLimpo,
      ]
    );

    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar cliente.",
    });
  }
});

export default router;