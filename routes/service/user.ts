import pool from '../../config/db.ts';
import { UserAdmin, UserPublic } from '../models/user.ts';

export async function getAll(offset: number = 0, count: number = 10): Promise<UserAdmin[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, username, email, role, deleted
       FROM public.users
       ORDER BY id
       LIMIT $1 OFFSET $2;`,
      [count, offset]
    );

    return result.rows.map(row => {
      const user = new UserAdmin();
      user.id = row.id;
      user.username = row.username;
      user.email = row.email;
      user.role = row.role;
      user.deleted = row.deleted ?? false;
      return user;
    });
  } finally {
    client.release();
  }
}

export async function getById(id: number): Promise<UserPublic> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, username, email, role, deleted
       FROM public.users
       WHERE id = $1 AND deleted != true;`,
      [id]
    );

    const row = result.rows[0];

    const user = new UserPublic();
    user.id = row.id;
    user.username = row.username;
    user.email = row.email;
    user.role = row.role;
    return user;
  } finally {
    client.release();
  }
}

export async function getByEmail(email: string): Promise<UserPublic> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, username, email, role, deleted
       FROM public.users
       WHERE email = $1 AND deleted != true;`,
      [email]
    );

    const row = result.rows[0];

    const user = new UserPublic();
    user.id = row.id;
    user.username = row.username;
    user.email = row.email;
    user.role = row.role;
    return user;
  } finally {
    client.release();
  }
}

export async function createUser(email: string, username: string, plainPassword: string): Promise<UserPublic> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO public.users (username, email, hashpass)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, role, deleted;`,
      [username, email, plainPassword]
    );

    const row = result.rows[0];

    const user = new UserPublic();
    user.id = row.id;
    user.username = row.username;
    user.email = row.email;
    user.role = row.role;
    return user;
  } finally {
    client.release();
  }
}

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

    return result.rows.length === 0;

  } finally {
    client.release();
  }
}
