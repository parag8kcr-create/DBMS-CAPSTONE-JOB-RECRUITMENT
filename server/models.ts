import mongoose, { Schema, Document } from 'mongoose';

export interface IJobDocument extends Document {
  _id: mongoose.Types.ObjectId;
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
  createdAt: Date;
}

export interface IApplicationDocument extends Document {
  _id: mongoose.Types.ObjectId;
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

export const JobSchema = new Schema<IJobDocument>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    postedByName: { type: String, required: true, trim: true },
    postedByRole: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    jobType: { type: String, enum: ['Full-Time', 'Remote', 'Internship'], default: 'Full-Time' },
    requiredSkills: [{ type: String, required: true }],
    minExperience: { type: Number, required: true, min: 0 },
    salaryRange: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'jobs', versionKey: false }
);

export const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    candidateSkills: [{ type: String, required: true }],
    experienceYears: { type: Number, required: true, min: 0 },
    educationOrRole: { type: String, required: true },
    aboutCandidate: { type: String, default: '' },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    status: {
      type: String,
      enum: ['Pending Review', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'],
      default: 'Pending Review',
    },
    hrFeedback: { type: String, default: 'Application received. HR team will review your skill match shortly.' },
    appliedAt: { type: String, required: true },
  },
  { collection: 'applications', versionKey: false }
);

export const JobModel = mongoose.models.Job || mongoose.model<IJobDocument>('Job', JobSchema);
export const ApplicationModel =
  mongoose.models.Application || mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
