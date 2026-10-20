import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const codigoPedido = "BC-CF36205B";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Configure DATABASE_URL antes de executar.");
  process.exit(1);
}

const db = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
});

try {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");

  const resultado = await db.query(
    `UPDATE pedidos
     SET token_acompanhamento_hash = $1
     WHERE codigo = $2
     RETURNING codigo`,
    [hash, codigoPedido]
  );

  if (resultado.rowCount !== 1) {
    throw new Error(
      `Esperado 1 pedido, mas foram encontrados ${resultado.rowCount}.`
    );
  }

  console.log("Pedido:", codigoPedido);
  console.log(
    "Link de acompanhamento:",
    `https://bychicuti.vercel.app/acompanhar-pedido?token=${token}`
  );
} catch (erro) {
  console.error("Erro ao gerar o link:", erro);
  process.exitCode = 1;
} finally {
  await db.end();
}
