
import { pool } from "./db.js";

try {
  const [rows] = await pool.query(
    "SELECT 1 AS conectado"
  );

  console.log("MySQL conectado:", rows);
} catch (error) {
  console.error("Erro na conexão MySQL:", error.message);
} finally {
  await pool.end();
}
