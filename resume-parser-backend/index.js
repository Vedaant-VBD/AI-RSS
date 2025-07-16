require('dotenv').config();
const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI; // Change if using Atlas or remote
const DB_NAME = 'resumeParserDB';

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseResumeFromPdf } = require('./parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const Job = require('./job.model');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Connect to MongoDB with mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser');

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (!['user', 'job_poster', 'admin', 'interviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role, name });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/upload', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  let client;
  try {
    // Use the advanced parsing logic
    const parsedResume = await parseResumeFromPdf(fs.readFileSync(req.file.path));
    fs.unlinkSync(req.file.path);

    // Connect to MongoDB Atlas and insert parsed data
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const result = await db.collection('resumes').insertOne({
      parsedResume: parsedResume,
      uploadedAt: new Date(),
    });

    res.json({ parsedResume: parsedResume, mongoId: result.insertedId });
  } catch (err) {
    console.error('Error parsing resume:', err);
    res.status(500).json({ error: 'Failed to parse or store PDF', details: err.stack || err.message });
  } finally {
    if (client) await client.close();
  }
});

// Login endpoint (now issues JWT directly)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Issue JWT directly
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Middleware to verify JWT and extract user info
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// POST /jobs - recruiter uploads a job description
app.post('/jobs', authenticateJWT, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    if (req.user.role !== 'recruiter' && req.user.role !== 'job_poster') {
      return res.status(403).json({ error: 'Only recruiters can post jobs.' });
    }

    // AI-powered job description parsing (using HuggingFace Inference API for demonstration)
    let descriptionStructured = null;
    try {
      const hfResp = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
        { inputs: description },
        { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}` } }
      );
      // For demo, just echo back the input and output
      descriptionStructured = {
        original: description,
        ai_summary: hfResp.data,
      };
    } catch (aiErr) {
      console.error('AI parsing failed:', aiErr.message);
      descriptionStructured = { original: description, ai_summary: null, error: aiErr.message };
    }

    const job = new Job({
      title,
      description,
      descriptionStructured, // Store the structured/AI-parsed version
      createdBy: req.user.userId,
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error('Job upload error:', err);
    res.status(500).json({ error: 'Failed to upload job.' });
  }
});

// GET /jobs - recruiter fetches their own jobs
app.get('/jobs', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'job_poster') {
      return res.status(403).json({ error: 'Only recruiters can view their jobs.' });
    }
    const jobs = await Job.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 