import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

/**
 * Get the PostgreSQL connection pool
 * Creates a new pool if one doesn't exist
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      pool = null; // Reset pool on error
    });
    
    console.log('✅ PostgreSQL connection pool created');
  }
  
  return pool;
}

/**
 * Execute a SQL query
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 */
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { 
        text: text.substring(0, 100), 
        duration: `${duration}ms`, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Close the database connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL connection pool closed');
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful at:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
