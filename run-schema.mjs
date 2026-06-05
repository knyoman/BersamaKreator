import 'dotenv/config';
import pkg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pkg;

const connectionString = process.env.SUPABASE_DB_URL || (
  process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${process.env.SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`
    : null
);

if (!connectionString) {
  throw new Error('SUPABASE_DB_URL atau SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD wajib diisi di environment lokal.');
}

async function runSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Menghubungkan ke database Supabase PostgreSQL...');
    await client.connect();
    console.log('Koneksi berhasil.');

    console.log('Membaca file supabase_schema.sql...');
    const schemaSql = readFileSync('supabase_schema.sql', 'utf8');

    console.log('Menjalankan schema...');
    await client.query(schemaSql);
    console.log('Schema berhasil dijalankan.');
  } catch (error) {
    console.error('Gagal menjalankan schema:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runSchema();
