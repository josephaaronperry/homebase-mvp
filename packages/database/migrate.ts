/**
 * Run all Supabase migrations in order.
 * Requires: DATABASE_URL (Supabase Postgres connection string from Project Settings → Database)
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' migrate.ts
 * Or:  npm run migrate  (add "migrate": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' migrate.ts" to package.json)
 */

import * as fs from 'fs';
import * as path from 'path';

const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations directory not found:', migrationsDir);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('No migration files found.');
  process.exit(0);
}

async function main() {
  const { Client } = await import('pg');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    console.error(
      'Missing DATABASE_URL. Set DATABASE_URL to your Supabase Postgres connection string.\n' +
        '  Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)\n' +
        '  Use the "Session pooler" or "Transaction pooler" URI for serverless.'
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('🔄 Running Supabase migrations...\n');

    for (const file of files) {
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf-8');
      console.log(`  → ${file}`);
      try {
        await client.query(sql);
        console.log(`    ✅ OK`);
      } catch (err: any) {
        if (err.code === '42P07' || err.message?.includes('already exists')) {
          console.log(`    ⚠ Skipped (already applied)`);
        } else {
          console.error(`    ❌ ${err.message}`);
          throw err;
        }
      }
    }

    console.log('\n✅ All migrations complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
