import pool from '../config/db.js';

/**
 * Retrieves the lobby code from the db.
 *
 * @returns The lobby code.
 */
export async function getLobbyCode(): Promise<string> {
  const client = await pool.connect();

  try {
    const result = await client.query<{ code: string }>(
      `SELECT code
       FROM public.lobby_code
       WHERE id = TRUE;`,
    );

    if (!result.rows[0]) {
      throw new Error('Lobby code has not been initialized.');
    }

    return result.rows[0].code;
  } finally {
    client.release();
  }
}

/**
 * Regenerates the Lobby Code in the db and returns it
 * @returns The newly generated code.
 */
export async function regenerateLobbyCode(): Promise<string> {
  const client = await pool.connect();

  try {
    const result = await client.query<{ code: string }>(
      `SELECT public.regenerate_lobby_code() AS code;`,
    );

    if (!result.rows[0]) {
      throw new Error('Failed to regenerate lobby code.');
    }

    return result.rows[0].code;
  } finally {
    client.release();
  }
}
