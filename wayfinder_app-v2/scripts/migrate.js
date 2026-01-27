import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../sqlite.db");
const migrationFile = path.resolve(__dirname, "../drizzle/0000_thin_fat_cobra.sql");

const db = new Database(dbPath);

console.log("Running migration...");

try {
    let sql = fs.readFileSync(migrationFile, "utf8");
    // Split by statement-breakpoint which is used by Drizzle
    const statements = sql.split("--> statement-breakpoint");

    db.pragma("foreign_keys = OFF");

    const executeTransaction = db.transaction(() => {
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    db.exec(trimmed);
                    console.log("Executed statement successfully");
                } catch (err) {
                    console.error(`Failed executing statement: \n${trimmed}\n`);
                    throw err;
                }
            }
        }
    });

    executeTransaction();

    db.pragma("foreign_keys = ON");
    console.log("Migration completed successfully.");
} catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
}
