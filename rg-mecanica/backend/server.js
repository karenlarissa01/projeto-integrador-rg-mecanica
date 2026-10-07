import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import clienteRoutes from "./routes/clienteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/clientes", clienteRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API RG Mecânica funcionando!",
    "banco": [
    {
      "conectado": 1
    }
  ]
  });
});

app.get("/api/teste-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS conectado");

    res.json({
      message: "MySQL conectado com sucesso!",
      banco: rows,
    });
  } catch (error) {
    console.error("========== ERRO MYSQL ==========");
    console.error(error);
    console.error("================================");

    res.status(500).json({
      message: "Erro ao conectar ao MySQL.",
      erro: error.message,
    });
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});