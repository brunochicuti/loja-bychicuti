
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
  },
  max: 5,
});
