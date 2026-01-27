#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  let databaseUrl = process.env.DATABASE_URL || process.argv[2];
  // If not provided, try to parse from .env in project root
  if (!databaseUrl) {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.*)$/m);
      if (match) databaseUrl = match[1].trim();
    }
  }
  if (!databaseUrl) {
    console.error('DATABASE_URL not provided. Set env or pass as arg.');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), 'drizzle', '0000_thin_fat_cobra.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL migration file not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to Postgres, beginning transaction...');
    await client.query('BEGIN');
    for (const stmt of statements) {
      try {
        console.log('Executing statement...');
        await client.query(stmt);
      } catch (err) {
        console.error('Failed statement:', stmt.slice(0,200));
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
