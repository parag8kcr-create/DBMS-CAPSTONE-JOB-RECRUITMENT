import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  initializeMongoDatabase,
  getAllJobs,
  createJobByHR,
  getAllApplications,
  submitUserApplication,
  updateApplicationStatusByHR,
} from './server/db.ts';

dotenv.config();

async function startServer() {
  await initializeMongoDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // 1. GET /api/jobs — Get all open jobs (with optional search/type filter)
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await getAllJobs(
        typeof req.query.search === 'string' ? req.query.search : undefined,
        typeof req.query.jobType === 'string' ? req.query.jobType : undefined
      );
      res.json({ ok: true, jobs });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 2. POST /api/jobs — Admin / HR / Manager posts a new job specification
  app.post('/api/jobs', async (req, res) => {
    try {
      const b = req.body;
      const skills = Array.isArray(b.requiredSkills)
        ? b.requiredSkills
        : String(b.requiredSkills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      if (!b.title || !b.company || skills.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'Job Title, Company Name, and at least 1 Required Skill are mandatory.',
        });
      }

      const job = await createJobByHR({
        title: b.title,
        company: b.company,
        postedByName: b.postedByName || 'HR Manager',
        postedByRole: b.postedByRole || 'HR & Talent Acquisition',
        location: b.location || 'Bengaluru / Remote',
        jobType: b.jobType || 'Full-Time',
        requiredSkills: skills,
        minExperience: Number(b.minExperience) || 0,
        salaryRange: b.salaryRange || '₹8 LPA – ₹14 LPA',
        description: b.description || 'Looking for skilled candidates matching our technical requirements.',
      });

      res.status(201).json({ ok: true, job });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // 3. GET /api/applications — Get candidate applications
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await getAllApplications(
        typeof req.query.jobId === 'string' ? req.query.jobId : undefined
      );
      res.json({ ok: true, applications });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 4. POST /api/applications — Normal User submits skills + experience to apply for a job
  app.post('/api/applications', async (req, res) => {
    try {
      const b = req.body;
      const skills = Array.isArray(b.candidateSkills)
        ? b.candidateSkills
        : String(b.candidateSkills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      if (!b.jobId || !b.candidateName || !b.candidateEmail || skills.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'Please enter your Name, Email, and the Skills you know.',
        });
      }

      const application = await submitUserApplication({
        jobId: b.jobId,
        candidateName: b.candidateName,
        candidateEmail: b.candidateEmail,
        phone: b.phone || '+91 98765 00000',
        candidateSkills: skills,
        experienceYears: Number(b.experienceYears) || 0,
        educationOrRole: b.educationOrRole || 'B.Tech / Software Developer',
        aboutCandidate: b.aboutCandidate || '',
      });

      res.status(201).json({ ok: true, application });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // 5. PATCH /api/applications/:id/status — HR / Manager updates status (Shortlist / Hire / Reject with Feedback)
  app.patch('/api/applications/:id/status', async (req, res) => {
    try {
      const updated = await updateApplicationStatusByHR(
        req.params.id,
        req.body.status,
        req.body.hrFeedback
      );
      res.json({ ok: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VeriHire Recruitment Server (Express + MongoDB) running on http://localhost:${PORT}`);
  });
}

startServer();
