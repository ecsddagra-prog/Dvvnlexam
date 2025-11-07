import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import contributorRoutes from './routes/contributor.js';
import employeeRoutes from './routes/employee.js';
import examRoutes from './routes/exam.js';
import mesariRoutes from './routes/mesari.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'HR Exam System API Running' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contributor', contributorRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/mesari', mesariRoutes);

const DEFAULT_PORT = process.env.SERVER_PORT || 3003;

function findAvailablePort(port) {
  return new Promise((resolve) => {
    const server = http
      .createServer()
      .listen(port, () => {
        server.close(() => resolve(port));
      })
      .on('error', () => {
        resolve(findAvailablePort(port + 1));
      });
  });
}

(async () => {
  const PORT = await findAvailablePort(DEFAULT_PORT);
  app.listen(PORT, () => {
    console.log(`🚀 Server started successfully on port ${PORT}`);
    if (PORT !== DEFAULT_PORT) {
      console.log(`⚠️  Port ${DEFAULT_PORT} was busy, using port ${PORT} instead`);
    }
  });
})();

export default app;
