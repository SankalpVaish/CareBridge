/**
 * Database access: a hosted Postgres database on Neon.
 *
 * The connection string comes from DATABASE_URL (set in Vercel; locally it
 * lives in .env.local). Neon's serverless driver sends each query over HTTPS,
 * so no connection is held open between requests, which suits Vercel.
 *
 * Tables and demo data are created by `npm run db:setup` (server/setup.js),
 * not on every start, so serverless cold starts stay fast.
 */
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add your Neon connection string to .env.local (see CONTRIBUTING.md).',
  )
}

export const sql = neon(process.env.DATABASE_URL)

/** All result rows. Use $1, $2, … placeholders. */
export function query(text, params = []) {
  return sql.query(text, params)
}

/** The first result row, or undefined. */
export async function one(text, params = []) {
  const rows = await sql.query(text, params)
  return rows[0]
}
