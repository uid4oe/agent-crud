import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../../../config/config.js";

const resetDatabase = async () => {
  const connectionString = config.database.url;

  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Resetting database schema (dropping public schema)...");

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await sql`DROP SCHEMA public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO postgres`;
    await sql`GRANT ALL ON SCHEMA public TO public`;
    console.log("Database reset completed successfully.");
  } catch (err) {
    console.error("Failed to reset database:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

resetDatabase();
