
// import "dotenv/config";
// import mysql from "mysql2/promise";

// export const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD ?? "",
//   database: process.env.DB_NAME || "rg_mecanica",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool PostgreSQL:", err);
});
