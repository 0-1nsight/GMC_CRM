import sql from 'mssql';

const config = {
  server: process.env.MSSQL_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.MSSQL_USER || 'sa',
      password: process.env.MSSQL_PASSWORD || 'YourPassword123!',
    },
  },
  options: {
    database: process.env.MSSQL_DATABASE || 'CRM',
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
    port: parseInt(process.env.MSSQL_PORT || '1433'),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function initializeDatabase() {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to MSSQL database');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.close();
  }
}
