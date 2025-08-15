
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Import the 'path' module
import { fileURLToPath } from 'url';
import apiRoutes from './api';
import { pool } from './db';

// Load environment variables from .env file
dotenv.config();

// Replicate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use('/', express.json()); // Parse JSON bodies

// --- Serve Frontend Files ---
// Point to the root directory to serve index.html and other frontend assets
const rootDir = path.join(__dirname, '..', '..');
app.use('/', express.static(rootDir));

// API Routes - all API calls will be under '/api'
app.use('/api', apiRoutes);

// --- SPA Fallback ---
// For any request that doesn't match a static file or an API route,
// send the index.html file. This is required for client-side routing to work.
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

const startServer = () => {
  // Test database connection but don't prevent server from starting.
  // The connection test runs asynchronously.
  pool.connect().then(client => {
      console.log('Successfully connected to the database.');
      client.release();
  }).catch(error => {
      console.error('\n*** DATABASE CONNECTION FAILED ***');
      
      // Provide environment-specific advice
      if (process.env.RENDER) {
          console.error('Error: Could not connect to the database on Render. Please ensure that:');
          console.error('  1. Your PostgreSQL database is running and accessible.');
          console.error("  2. The 'DATABASE_URL' environment variable is correctly set in your Web Service's settings.");
          console.error("  3. You are using the 'Internal Connection String' provided by Render for your database.");
          console.error("  4. Your Web Service and Database are in the same region.");
      } else {
          console.error('Error: Could not connect to the database. Please ensure that:');
          console.error('  1. Your PostgreSQL server is running locally.');
          console.error('  2. The DATABASE_URL in your backend/.env file is correct.');
      }
      
      console.error('\nUnderlying Error:', error);
      console.error('\nNOTE: The server will start, but API endpoints will likely fail until the database is connected.');
  });

  // Start the server regardless of the initial database connection status.
  // This ensures the frontend is always served.
  app.listen(port, () => {
    console.log(`Backend server is listening on http://localhost:${port}`);
  });
};

startServer();