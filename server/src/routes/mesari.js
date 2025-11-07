import express from 'express';
import mesariAPI from '../config/mesari.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get employee data from Mesari
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const response = await mesariAPI.get('/employees');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees from Mesari' });
  }
});

// Sync employee data with local database
router.post('/sync-employees', authenticateToken, async (req, res) => {
  try {
    const response = await mesariAPI.get('/employees');
    const employees = response.data;
    
    // Process and sync with local database
    // Implementation depends on Mesari API response structure
    
    res.json({ message: 'Employees synced successfully', count: employees.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync employees' });
  }
});

// Get training modules from Mesari
router.get('/training-modules', authenticateToken, async (req, res) => {
  try {
    const response = await mesariAPI.get('/training/modules');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch training modules' });
  }
});

// Submit exam results to Mesari
router.post('/submit-results', authenticateToken, async (req, res) => {
  try {
    const { examId, employeeId, score, completedAt } = req.body;
    
    const response = await mesariAPI.post('/training/results', {
      exam_id: examId,
      employee_id: employeeId,
      score,
      completed_at: completedAt
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit results to Mesari' });
  }
});

export default router;