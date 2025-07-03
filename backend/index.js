import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import route handlers
import { analyzeResume } from './routes/resume.js';
import { generateQuestions, evaluateAnswer } from './routes/interview.js';
import { careerAssistant, generateReport } from './routes/career.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'CareerMate AI Backend API', 
    version: '1.0.0',
    endpoints: [
      'POST /api/analyze-resume',
      'POST /api/generate-questions',
      'POST /api/evaluate-answer',
      'POST /api/career-assistant',
      'POST /api/generate-report'
    ]
  });
});

// Resume Analysis Route
app.post('/api/analyze-resume', upload.single('resume'), analyzeResume);

// Interview Routes
app.post('/api/generate-questions', generateQuestions);
app.post('/api/evaluate-answer', evaluateAnswer);

// Career Assistant Routes
app.post('/api/career-assistant', careerAssistant);
app.post('/api/generate-report', generateReport);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  if (error.message === 'Only PDF files are allowed!') {
    return res.status(400).json({ error: 'Only PDF files are allowed!' });
  }
  
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CareerMate AI Backend running on port ${PORT}`);
  console.log(`📋 API Documentation available at http://localhost:${PORT}`);
});

export default app;