import { Pool } from 'pg'

// PostgreSQL connection pool
let pool: Pool | null = null

export function getPostgresPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_CONNECTION_STRING
    
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_CONNECTION_STRING environment variable is required for direct PostgreSQL connection')
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  return pool
}

export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getPostgresPool().connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Test the connection
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()')
    return true
  } catch (error) {
    console.error('PostgreSQL connection failed:', error)
    return false
  }
} 