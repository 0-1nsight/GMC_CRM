import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

function buildConfig(): any {
  const rawServer = process.env.MSSQL_SERVER || 'localhost';
  let server = rawServer;
  let instanceName: string | undefined;

  const portEnvProvided = typeof process.env.MSSQL_PORT !== 'undefined' && process.env.MSSQL_PORT !== '';
  const portValue = portEnvProvided ? parseInt(process.env.MSSQL_PORT as string, 10) : undefined;

  // Support named instance format HOST\\INSTANCE
  if (rawServer.includes('\\')) {
    const parts = rawServer.split('\\');
    server = parts[0] || 'localhost';
    instanceName = parts[1] || undefined;
  }

  const cfg: any = {
    server,
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || '2@change',
    database: process.env.MSSQL_DATABASE || 'GMC',
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
    }
    // connectionTimeout: 30000,
    // requestTimeout: 30000,
  };

  // If the user explicitly provided a port, prefer TCP connection by port
  // and do not set instanceName (instance resolution uses SQL Browser).
  if (portEnvProvided && portValue) {
    cfg.port = portValue;
    // do not set instanceName when port is specified
  } else if (instanceName) {
    cfg.options.instanceName = instanceName;
  }

  // // Safe debug (don't log credentials)
  // console.log('Database config summary:', {
  //   server: cfg.server,
  //   instanceName: instanceName || null,
  //   database: cfg.database,
  //   port: cfg.port,
  //   encrypt: cfg.options.encrypt,
  // });

  return cfg;
}

export async function initializeDatabase() {
  try {
    const config = buildConfig();
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to MSSQL database');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Connection guidance: if you are using a named instance like HOST\\INSTANCE, either remove the port and ensure SQL Browser (UDP 1434) is reachable, or set MSSQL_SERVER to the instance host IP and MSSQL_PORT to the TCP port (usually 1433).');
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
