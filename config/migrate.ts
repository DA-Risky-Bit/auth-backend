import fs from 'node:fs/promises';
import path from 'node:path';
import pool from './db';

export async function migrate() {
  const client = await pool.connect();
  try {
    // 1. bootstrap (idempotent) - resolved directly via __dirname
    const bootstrapPath = path.join(__dirname, '000_bootstrap.sql');
    const bootstrapSql = await fs.readFile(bootstrapPath, 'utf8');
    await client.query(bootstrapSql);

    // 2. register new scripts as pending
    const updatesDir = path.join(__dirname, 'updates');

    try {
      const files = (await fs.readdir(updatesDir)).filter(f => f.endsWith('.sql')).sort();
      for (const name of files) {
        const sql = await fs.readFile(path.join(updatesDir, name), 'utf8');
        await client.query(
          `INSERT INTO database_updates (id_dbupdate_status, script_name, script_sql)
           SELECT s.id, $1, $2
             FROM database_update_statuses s
            WHERE s.name = 'pending'
              AND NOT EXISTS (SELECT 1 FROM database_updates u
                               WHERE u.script_name = $1
                                 AND u.id_dbupdate_status IN (SELECT id FROM database_update_statuses
                                                               WHERE name IN ('pending','successful')))`,
          [name, sql]
        );
      }
    } catch {
      // If updates folder doesn't exist yet, skip this step gracefully
    }

    // 3. run them
    const { rows } = await client.query('SELECT db_auto_schema_update() AS ok');
    if (!rows[0].ok) throw new Error('Schema update failed; see database_updates.script_results');
  } finally {
    client.release();
  }
}
