import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../src/db/pool.js";

async function main() {
  const sqlPath = resolve(process.cwd(), "sql", "schema.sql");
  const sql = await readFile(sqlPath, "utf8");
  await pool.query(sql);
  console.log("Database schema applied.");
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });

