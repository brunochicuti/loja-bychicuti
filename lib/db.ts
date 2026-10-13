import { Pool } from "pg";

export const db = new Pool({
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "bychicuti",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
});