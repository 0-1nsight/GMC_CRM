import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { initializeDatabase, closeDatabase } from './db.js';
import routes from './routes.js';

// // dotenv.config();

// // --- ADD THESE LINES TO LOG YOUR ENVIRONMENT VARIABLES ---
// console.log('--- ENV VARIABLE CHECK ---');
// console.log('MSSQL_SERVER:', process.env.MSSQL_SERVER);
// console.log('MSSQL_USER:', process.env.MSSQL_USER);
// console.log('MSSQL_DATABASE:', process.env.MSSQL_DATABASE);
// console.log('App Port (PORT):', process.env.PORT);
// console.log('--- END ENV CHECK ---');
// //

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());
app.use('/api', routes);

async function start() {
  try {
    await initializeDatabase();

    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? '0.0.0.0' : HOST;
      console.log(`Server running on http://${displayHost}:${PORT}`);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
