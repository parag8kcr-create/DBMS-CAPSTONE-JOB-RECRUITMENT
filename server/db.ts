import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { JobModel, ApplicationModel } from './models.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'recruitment_mongodb.json');

export interface PlainJob {
  _id: string;
  title: string;
  company: string;
  postedByName: string;
  postedByRole: string;
  location: string;
  jobType: 'Full-Time' | 'Remote' | 'Internship';
  requiredSkills: string[];
  minExperience: number;
  salaryRange: string;
  description: string;
  createdAt: string;
}

export interface PlainApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  candidateName: string;
  candidateEmail: string;
  phone: string;
  candidateSkills: string[];
  experienceYears: number;
  educationOrRole: string;
  aboutCandidate: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  status: 'Pending Review' | 'Shortlisted' | 'Interview Scheduled' | 'Hired' | 'Rejected';
  hrFeedback: string;
  appliedAt: string;
}

let store: { jobs: PlainJob[]; applications: PlainApplication[] } = {
  jobs: [],
  applications: [],
};

// Unique Factor Helper: Calculates exact Skill + Experience Match % and identifies missing skills
export function calculateSkillAndExperienceMatch(
  requiredSkills: string[],
  minExperience: number,
  candidateSkills: string[],
  candidateExperience: number
) {
  const normCandidate = candidateSkills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of requiredSkills) {
    const cleanReq = reqSkill.trim();
    const isMatched = normCandidate.some(
      (cs) => cs === cleanReq.toLowerCase() || cs.includes(cleanReq.toLowerCase()) || cleanReq.toLowerCase().includes(cs)
    );
    if (isMatched) {
      matchedSkills.push(cleanReq);
    } else {
      missingSkills.push(cleanReq);
    }
  }

  const skillRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1;
  const expRatio =
    minExperience <= 0 ? 1 : Math.min(1, candidateExperience / minExperience);

  // 75% weight to skills, 25% weight to experience requirement
  const matchScore = Math.round(skillRatio * 75 + expRatio * 25);

  return {
    matchScore,
    matchedSkills,
    missingSkills,
  };
}

function getInitialSeed(): { jobs: PlainJob[]; applications: PlainApplication[] } {
  const job1Id = new mongoose.Types.ObjectId('6739a100c9f1b20015a40101').toHexString();
  const job2Id = new mongoose.Types.ObjectId('6739a100c9f1b20015a40102').toHexString();
  const job3Id = new mongoose.Types.ObjectId('6739a100c9f1b20015a40103').toHexString();
  const job4Id = new mongoose.Types.ObjectId('6739a100c9f1b20015a40104').toHexString();

  const jobs: PlainJob[] = [
    {
      _id: job1Id,
      title: 'Full Stack MERN Developer',
      company: 'TechNova Solutions',
      postedByName: 'Ananya Sharma',
      postedByRole: 'HR Manager',
      location: 'Bengaluru / Hybrid',
      jobType: 'Full-Time',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript'],
      minExperience: 2,
      salaryRange: '₹12 LPA – ₹18 LPA',
      description:
        'Looking for a Full Stack Developer to build scalable web applications using React, Node.js, Express, and MongoDB.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      _id: job2Id,
      title: 'Frontend React Developer',
      company: 'PixelCraft Studio',
      postedByName: 'Rohit Verma',
      postedByRole: 'Engineering Manager',
      location: 'Remote',
      jobType: 'Remote',
      requiredSkills: ['React', 'JavaScript', 'Tailwind CSS', 'HTML', 'Git'],
      minExperience: 1,
      salaryRange: '₹8 LPA – ₹13 LPA',
      description:
        'Join our product team to create clean, responsive user interfaces and dashboard components in React and Tailwind CSS.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      _id: job3Id,
      title: 'Backend Node.js & Database Engineer',
      company: 'CloudScale India',
      postedByName: 'Vikram Singhania',
      postedByRole: 'Technical Hiring Lead',
      location: 'Noida / Hybrid',
      jobType: 'Full-Time',
      requiredSkills: ['Node.js', 'MongoDB', 'REST API', 'Docker', 'SQL'],
      minExperience: 3,
      salaryRange: '₹15 LPA – ₹22 LPA',
      description:
        'Responsible for designing REST APIs, managing MongoDB schemas & indexing, and optimizing backend server performance.',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      _id: job4Id,
      title: 'Software Engineering Intern',
      company: 'NextGen Labs',
      postedByName: 'Neha Kapoor',
      postedByRole: 'Campus HR Lead',
      location: 'Pune / Remote',
      jobType: 'Internship',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      minExperience: 0,
      salaryRange: '₹35,000 / month (PPO: ₹10 LPA)',
      description:
        'Freshers and final-year students welcome. Work directly with senior mentors on full-stack web features.',
      createdAt: new Date().toISOString(),
    },
  ];

  const applications: PlainApplication[] = [
    {
      _id: new mongoose.Types.ObjectId('6739b200c9f1b20015a40201').toHexString(),
      jobId: job1Id,
      jobTitle: 'Full Stack MERN Developer',
      company: 'TechNova Solutions',
      candidateName: 'Rohan Gupta',
      candidateEmail: 'rohan.gupta@gmail.com',
      phone: '+91 98765 43210',
      candidateSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
      experienceYears: 2,
      educationOrRole: 'B.Tech CSE · Full Stack Developer',
      aboutCandidate: 'Built 4 production MERN projects with REST APIs and MongoDB Atlas.',
      matchScore: 85,
      matchedSkills: ['React', 'Node.js', 'MongoDB', 'Express'],
      missingSkills: ['TypeScript'],
      status: 'Shortlisted',
      hrFeedback:
        'Strong 85% match on core MERN stack and meets the 2-year experience requirement. Shortlisted for technical round.',
      appliedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      _id: new mongoose.Types.ObjectId('6739b200c9f1b20015a40202').toHexString(),
      jobId: job2Id,
      jobTitle: 'Frontend React Developer',
      company: 'PixelCraft Studio',
      candidateName: 'Sneha Nair',
      candidateEmail: 'sneha.nair@outlook.com',
      phone: '+91 98111 22334',
      candidateSkills: ['React', 'JavaScript', 'Tailwind CSS', 'HTML', 'Git'],
      experienceYears: 2,
      educationOrRole: 'MCA · Frontend Engineer',
      aboutCandidate: 'Specialized in responsive React dashboards and clean UI design.',
      matchScore: 100,
      matchedSkills: ['React', 'JavaScript', 'Tailwind CSS', 'HTML', 'Git'],
      missingSkills: [],
      status: 'Interview Scheduled',
      hrFeedback:
        '100% skill & experience match! Interview scheduled for tomorrow at 11:00 AM with Engineering Manager Rohit Verma.',
      appliedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      _id: new mongoose.Types.ObjectId('6739b200c9f1b20015a40203').toHexString(),
      jobId: job3Id,
      jobTitle: 'Backend Node.js & Database Engineer',
      company: 'CloudScale India',
      candidateName: 'Aman Verma',
      candidateEmail: 'aman.verma@yahoo.com',
      phone: '+91 91234 56789',
      candidateSkills: ['Node.js', 'MongoDB', 'REST API'],
      experienceYears: 1,
      educationOrRole: 'B.Tech IT · Junior Backend Developer',
      aboutCandidate: 'Passionate about backend APIs and MongoDB database design.',
      matchScore: 53,
      matchedSkills: ['Node.js', 'MongoDB', 'REST API'],
      missingSkills: ['Docker', 'SQL'],
      status: 'Pending Review',
      hrFeedback: 'Application received. HR team will review your skill match shortly.',
      appliedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  return { jobs, applications };
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

export async function initializeMongoDatabase() {
  const envUri = process.env.MONGODB_URI;
  if (envUri && envUri !== 'MY_MONGODB_URI' && !envUri.includes('127.0.0.1')) {
    try {
      await mongoose.connect(envUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB via Mongoose.');
    } catch {
      console.warn('Using local Mongoose-validated BSON store.');
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
        store = parsed;
        return;
      }
    } catch {
      // Fallback to seed
    }
  }

  store = getInitialSeed();
  saveStore();
}

export async function getAllJobs(search?: string, jobType?: string): Promise<PlainJob[]> {
  let list = [...store.jobs];
  if (jobType && jobType !== 'All') {
    list = list.filter((j) => j.jobType === jobType);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function createJobByHR(payload: Omit<PlainJob, '_id' | 'createdAt'>): Promise<PlainJob> {
  const newId = new mongoose.Types.ObjectId();
  const job: PlainJob = {
    ...payload,
    _id: newId.toHexString(),
    createdAt: new Date().toISOString(),
  };

  // Validate with Mongoose Schema
  const doc = new JobModel({ ...job, _id: newId });
  const err = doc.validateSync();
  if (err) {
    throw new Error(err.message);
  }

  store.jobs.unshift(job);
  saveStore();
  return job;
}

export async function getAllApplications(jobId?: string): Promise<PlainApplication[]> {
  if (jobId && jobId !== 'All') {
    return store.applications.filter((a) => a.jobId === jobId);
  }
  return [...store.applications];
}

export async function submitUserApplication(payload: {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  phone: string;
  candidateSkills: string[];
  experienceYears: number;
  educationOrRole: string;
  aboutCandidate: string;
}): Promise<PlainApplication> {
  const job = store.jobs.find((j) => j._id === payload.jobId);
  if (!job) {
    throw new Error('Job not found in MongoDB.');
  }

  const { matchScore, matchedSkills, missingSkills } = calculateSkillAndExperienceMatch(
    job.requiredSkills,
    job.minExperience,
    payload.candidateSkills,
    Number(payload.experienceYears)
  );

  const newId = new mongoose.Types.ObjectId();
  const app: PlainApplication = {
    _id: newId.toHexString(),
    jobId: job._id,
    jobTitle: job.title,
    company: job.company,
    candidateName: payload.candidateName,
    candidateEmail: payload.candidateEmail,
    phone: payload.phone,
    candidateSkills: payload.candidateSkills,
    experienceYears: Number(payload.experienceYears),
    educationOrRole: payload.educationOrRole,
    aboutCandidate: payload.aboutCandidate,
    matchScore,
    matchedSkills,
    missingSkills,
    status: 'Pending Review',
    hrFeedback:
      missingSkills.length === 0
        ? '100% Skill Match verified automatically! Prioritized for HR Manager review.'
        : `Auto-screened (${matchScore}% match). Tip: Learning ${missingSkills.join(', ')} will boost your profile to 100% for this role.`,
    appliedAt: new Date().toISOString(),
  };

  const doc = new ApplicationModel({ ...app, _id: newId });
  const err = doc.validateSync();
  if (err) {
    throw new Error(err.message);
  }

  store.applications.unshift(app);
  saveStore();
  return app;
}

export async function updateApplicationStatusByHR(
  id: string,
  status: PlainApplication['status'],
  hrFeedback: string
): Promise<PlainApplication> {
  const app = store.applications.find((a) => a._id === id);
  if (!app) {
    throw new Error('Application not found.');
  }

  if (!hrFeedback || hrFeedback.trim().length < 5) {
    throw new Error('Please provide a short feedback note or reason for the candidate (No-Ghosting Rule).');
  }

  app.status = status;
  app.hrFeedback = hrFeedback.trim();
  saveStore();
  return app;
}
