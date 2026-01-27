import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION || "postgresql://localhost:5432/wayfinder";
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });
