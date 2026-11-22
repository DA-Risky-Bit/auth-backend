import pool from '../config/db.js';
import { UserAdmin, UserProfilePublic, UserProfileDetailed } from '../models/user.js';

/**
 * Retrieves a paginated list of all users from the database.
 *
 * @param offset - Number of records to skip for pagination (default: 0)
 * @param count - Maximum number of records to return (default: 10)
 * @returns A promise resolving to an array of `UserAdmin` instances
 */
export async function getAll(offset: number = 0, count: number = 10): Promise<UserAdmin[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      id: number;
      username: string;
      email: string;
      role: number;
      deleted: boolean;
    }>(
      `SELECT id, username, email, role, deleted
       FROM public.users
       ORDER BY id
       LIMIT $1 OFFSET $2;`,
      [count, offset]
    );

    return result.rows.map(row =>
      new UserAdmin(
        row.id,
        row.username,
        row.email,
        row.role,
        row.deleted ?? false
      )
    );
  } finally {
    client.release();
  }
}

/**
 * Retrieves a non-deleted user's public profile by their unique ID (omitting sensitive fields like email).
 *
 * @param id - The unique identifier of the user
 * @returns A promise resolving to a `UserProfilePublic` instance
 * @throws Error if the user is not found
 */
export async function getById(id: number): Promise<UserProfilePublic> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      id: number;
      username: string;
      role: number;
      deleted: boolean;
    }>(
      `SELECT id, username, role, deleted
       FROM public.users
       WHERE id = $1 AND deleted != true;`,
      [id]
    );

    const row = result.rows[0];
    if (!row) throw new Error('User not found');

    return new UserProfilePublic(row.id, row.username, row.role);
  } finally {
    client.release();
  }
}

/**
 * Retrieves a non-deleted user's detailed profile including email (for self or admin views).
 *
 * @param id - The unique identifier of the user
 * @returns A promise resolving to a `UserProfileDetailed` instance
 * @throws Error if the user is not found
 */
export async function getDetailedById(id: number): Promise<UserProfileDetailed> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      id: number;
      username: string;
      email: string;
      role: number;
      deleted: boolean;
    }>(
      `SELECT id, username, email, role, deleted
       FROM public.users
       WHERE id = $1 AND deleted != true;`,
      [id]
    );

    const row = result.rows[0];
    if (!row) throw new Error('User not found');

    return new UserProfileDetailed(row.id, row.username, row.email, row.role, row.deleted);
  } finally {
    client.release();
  }
}

/**
 * Retrieves a non-deleted user by their email address (used for internal authentication lookups).
 *
 * @param email - The email address of the user
 * @returns A promise resolving to a `UserAdmin` instance containing credentials and details
 * @throws Error if the user is not found
 */
export async function getByEmail(email: string): Promise<UserProfileDetailed> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      id: number;
      username: string;
      email: string;
      role: number;
      deleted: boolean;
    }>(
      `SELECT id, username, email, role, deleted
       FROM public.users
       WHERE email = $1 AND deleted != true;`,
      [email]
    );

    const row = result.rows[0];
    if (!row) throw new Error('User not found');

    return new UserProfileDetailed(row.id, row.username, row.email, row.role, row.deleted);
  } finally {
    client.release();
  }
}

/**
 * Creates a new user in the database using secure password hashing via `crypt`.
 *
 * @param email - The user's email address
 * @param username - The user's username
 * @param plainPassword - The plaintext password to be hashed by the database
 * @returns A promise resolving to a `UserProfileDetailed` instance of the newly created user
 */
export async function createUser(email: string, username: string, plainPassword: string): Promise<UserProfileDetailed> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      id: number;
      username: string;
      email: string;
      role: number;
      deleted: boolean;
    }>(
      `INSERT INTO public.users (username, email, hashpass)
        VALUES ($1, $2, crypt($3, gen_salt('bf')))
        RETURNING id, username, email, role, deleted;`,
      [username, email, plainPassword]
    );

    const row = result.rows[0];

    return new UserProfileDetailed(row.id, row.username, row.email, row.role, row.deleted);
  } finally {
    client.release();
  }
}

/**
 * Performs a soft delete on a user by setting their `deleted` status to true.
 *
 * @param id - The unique identifier of the user to soft-delete
 * @returns A promise resolving to `true` if the update succeeded, or `false` otherwise
 */
export async function markUserAsDeleted(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE public.users
       SET deleted = true
       WHERE id = $1 AND deleted IS NOT TRUE;`,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/**
 * Permanently deletes a user from the database.
 *
 * @param id - The unique identifier of the user to delete
 * @returns A promise resolving to `true` if a row was deleted, or `false` otherwise
 */
export async function deleteUser(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM public.users
       WHERE id = $1;`,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/**
 * Updates a user's username.
 *
 * @param id - The unique identifier of the user
 * @param new_username - The new username string
 * @returns A promise resolving to `true` if the update succeeded, or `false` otherwise
 */
export async function updateUsername(id: number, new_username: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE public.users
       SET username = $1
       WHERE id = $2;`,
      [new_username, id]
    );

    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/**
 * Verifies a user's password using database cryptographic functions (`crypt`).
 *
 * @param email - The email address associated with the account
 * @param plainPassword - The candidate plaintext password
 * @returns A promise resolving to `true` if credentials match, or `false` otherwise
 */
export async function verifyPassword(email: string, plainPassword: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, username, email, role, deleted
       FROM public.users
       WHERE email = $1
         AND hashpass = crypt($2, hashpass);`,
      [email, plainPassword]
    );

    return result.rows.length > 0;
  } finally {
    client.release();
  }
}
