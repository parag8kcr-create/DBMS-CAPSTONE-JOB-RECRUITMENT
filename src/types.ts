export interface Job {
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

export interface Application {
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
