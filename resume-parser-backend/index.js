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

// Utility: Score a resume against a job description (priority: experience > education > skills)
function scoreResume(resume, job) {
  // Extract job requirements
  const jobReq = job.descriptionStructured?.ai_summary || {};
  // For demo, expect jobReq to have .skills (array), .degree (string), .experience (years or string)
  // Fallback to empty if not present
  const requiredSkills = (jobReq.skills || []).map(s => s.toLowerCase());
  const requiredDegree = (jobReq.degree || '').toLowerCase();
  const requiredExperience = parseFloat(jobReq.experience) || 0;

  // Extract from resume
  const resumeSkills = (resume.skills?.descriptions || []).map(s => s.toLowerCase());
  const resumeDegrees = (resume.educations || []).map(e => (e.degree || '').toLowerCase());
  const resumeExperienceYears = (() => {
    // Try to estimate total years from workExperiences
    if (!resume.workExperiences) return 0;
    let years = 0;
    for (const exp of resume.workExperiences) {
      if (exp.date) {
        // Try to parse years from date string (very basic)
        const matches = exp.date.match(/(\d{4})/g);
        if (matches && matches.length >= 2) {
          years += Math.abs(parseInt(matches[1]) - parseInt(matches[0]));
        }
      }
    }
    return years;
  })();

  // Experience score (0-1)
  let expScore = 0;
  if (requiredExperience > 0) {
    expScore = Math.min(resumeExperienceYears / requiredExperience, 1);
  } else {
    expScore = resumeExperienceYears > 0 ? 1 : 0;
  }

  // Education score (0-1)
  let eduScore = 0;
  if (requiredDegree) {
    eduScore = resumeDegrees.some(d => d.includes(requiredDegree)) ? 1 : 0;
  } else {
    eduScore = resumeDegrees.length > 0 ? 1 : 0;
  }

  // Skills score (0-1)
  let skillScore = 0;
  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter(req => resumeSkills.some(s => s.includes(req)));
    skillScore = matched.length / requiredSkills.length;
  } else {
    skillScore = resumeSkills.length > 0 ? 1 : 0;
  }

  // Weighted total: experience 50%, education 30%, skills 20%
  const total = expScore * 0.5 + eduScore * 0.3 + skillScore * 0.2;
  return { total, expScore, eduScore, skillScore, resumeExperienceYears, resumeDegrees, resumeSkills };
}

// POST /match-resumes?jobId=... - returns ranked resumes for a job
app.get('/match-resumes', authenticateJWT, async (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ error: 'jobId required' });
  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    // Fetch all resumes from MongoDB (native driver)
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const resumesRaw = await db.collection('resumes').find({}).toArray();
    const resumes = resumesRaw.map(r => r.parsedResume);
    // Score and rank
    const scored = resumes.map(r => ({ resume: r, score: scoreResume(r, job) }));
    scored.sort((a, b) => b.score.total - a.score.total);
    res.json(scored);
    await client.close();
  } catch (err) {
    console.error('Match resumes error:', err);
    res.status(500).json({ error: 'Failed to match resumes.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 