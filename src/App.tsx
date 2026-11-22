import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Briefcase,
  UserCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  PlusCircle,
  Building2,
  X,
} from 'lucide-react';
import { Job, Application } from './types';

type ActivePortal = 'user' | 'admin' | 'unique';

function computeClientMatch(
  requiredSkills: string[],
  minExperience: number,
  userSkillsRaw: string,
  userExp: number
) {
  const userSkills = userSkillsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of requiredSkills) {
    const cleanReq = req.trim();
    const hit = userSkills.some(
      (us) =>
        us === cleanReq.toLowerCase() ||
        us.includes(cleanReq.toLowerCase()) ||
        cleanReq.toLowerCase().includes(us)
    );
    if (hit) matched.push(cleanReq);
    else missing.push(cleanReq);
  }

  const skillRatio = requiredSkills.length > 0 ? matched.length / requiredSkills.length : 1;
  const expRatio = minExperience <= 0 ? 1 : Math.min(1, userExp / minExperience);
  const score = Math.round(skillRatio * 75 + expRatio * 25);

  return { score, matched, missing };
}

export default function App() {
  const [activePortal, setActivePortal] = useState<ActivePortal>('user');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // User Portal — Candidate's Live Profile (Skills + Experience) for Instant Match & 1-Click Apply
  const [candidateName, setCandidateName] = useState('Parag Kumar');
  const [candidateEmail, setCandidateEmail] = useState('parag@student.edu');
  const [candidatePhone, setCandidatePhone] = useState('+91 98765 43210');
  const [candidateRole, setCandidateRole] = useState('B.Tech CSE · Full Stack Developer');
  const [candidateSkillsInput, setCandidateSkillsInput] = useState('React, Node.js, MongoDB, JavaScript, HTML');
  const [candidateExperience, setCandidateExperience] = useState<number>(1);
  const [candidateBio, setCandidateBio] = useState(
    'Built full-stack web projects using React, Express, and MongoDB.'
  );

  // User Portal Search & Apply Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState<string>('All');
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [userBannerMsg, setUserBannerMsg] = useState<string | null>(null);

  // Admin / HR Portal — New Job Specification Form State
  const [hrJobTitle, setHrJobTitle] = useState('');
  const [hrCompany, setHrCompany] = useState('');
  const [hrName, setHrName] = useState('Ananya Sharma');
  const [hrRole, setHrRole] = useState('HR Manager');
  const [hrLocation, setHrLocation] = useState('Bengaluru / Hybrid');
  const [hrJobType, setHrJobType] = useState<Job['jobType']>('Full-Time');
  const [hrRequiredSkills, setHrRequiredSkills] = useState('React, Node.js, MongoDB, TypeScript');
  const [hrMinExp, setHrMinExp] = useState<number>(1);
  const [hrSalary, setHrSalary] = useState('₹10 LPA – ₹15 LPA');
  const [hrDescription, setHrDescription] = useState(
    'We need a developer who can build frontend UI and connect backend APIs with MongoDB.'
  );
  const [postingJob, setPostingJob] = useState(false);
  const [adminFilterJobId, setAdminFilterJobId] = useState<string>('All');
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [adminBannerMsg, setAdminBannerMsg] = useState<string | null>(null);

  const [heroImgError, setHeroImgError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedJobType !== 'All') params.set('jobType', selectedJobType);

      const [jobsRes, appsRes] = await Promise.all([
        fetch(`/api/jobs?${params.toString()}`),
        fetch('/api/applications'),
      ]);
      const [jobsData, appsData] = await Promise.all([jobsRes.json(), appsRes.json()]);

      if (jobsData.ok) setJobs(jobsData.jobs);
      if (appsData.ok) setApplications(appsData.applications);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedJobType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply to Job Handler (User Portal)
  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    setSubmittingApp(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: applyingJob._id,
          candidateName,
          candidateEmail,
          phone: candidatePhone,
          candidateSkills: candidateSkillsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experienceYears: candidateExperience,
          educationOrRole: candidateRole,
          aboutCandidate: candidateBio,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setApplyingJob(null);
        setUserBannerMsg(
          `Applied to ${applyingJob.title} at ${applyingJob.company}! Your Smart Match Score (${data.application.matchScore}%) has been saved in MongoDB.`
        );
        await fetchData();
      }
    } finally {
      setSubmittingApp(false);
    }
  };

  // Post New Job Specification Handler (Admin / HR Portal)
  const handlePostJobByHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrJobTitle.trim() || !hrCompany.trim()) return;
    setPostingJob(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hrJobTitle,
          company: hrCompany,
          postedByName: hrName,
          postedByRole: hrRole,
          location: hrLocation,
          jobType: hrJobType,
          requiredSkills: hrRequiredSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          minExperience: hrMinExp,
          salaryRange: hrSalary,
          description: hrDescription,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setHrJobTitle('');
        setHrCompany('');
        setAdminBannerMsg(
          `New Job "${data.job.title}" posted to MongoDB! Users can now see their live skill match and apply.`
        );
        await fetchData();
      }
    } finally {
      setPostingJob(false);
    }
  };

  // HR Status Decision Handler (Shortlist / Interview / Hire / Reject with Feedback)
  const handleUpdateCandidateStatus = async (
    app: Application,
    newStatus: Application['status']
  ) => {
    const defaultNote =
      newStatus === 'Shortlisted'
        ? `Shortlisted by HR! Your skills (${app.matchedSkills.join(', ')}) matched ${app.matchScore}% of our requirements.`
        : newStatus === 'Interview Scheduled'
        ? 'Technical interview scheduled with the Hiring Manager. Check your email for the meeting link.'
        : newStatus === 'Hired'
        ? `Congratulations! You have been selected for ${app.jobTitle} at ${app.company}.`
        : app.missingSkills.length > 0
        ? `Not selected for this round because this role requires hands-on experience in: ${app.missingSkills.join(', ')}.`
        : 'Thank you for applying. We proceeded with a candidate having more years of domain experience.';

    const feedbackToUse =
      feedbackDrafts[app._id] !== undefined && feedbackDrafts[app._id].trim().length > 0
        ? feedbackDrafts[app._id]
        : defaultNote;

    const res = await fetch(`/api/applications/${app._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        hrFeedback: feedbackToUse,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setAdminBannerMsg(
        `Updated ${app.candidateName}'s status to "${newStatus}" with transparent feedback in MongoDB.`
      );
      await fetchData();
    }
  };

  const filteredAdminApplications = useMemo(() => {
    if (adminFilterJobId === 'All') return applications;
    return applications.filter((a) => a.jobId === adminFilterJobId);
  }, [applications, adminFilterJobId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#user"
            onClick={(e) => {
              e.preventDefault();
              setActivePortal('user');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            VeriHire
          </a>

          {/* Zone 2: Simple 3-Link Navigation */}
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto">
            <button
              onClick={() => setActivePortal('user')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activePortal === 'user'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              User Portal (Apply Jobs)
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activePortal === 'admin'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Admin / HR Portal (Post & Hire)
            </button>
            <button
              onClick={() => setActivePortal('unique')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activePortal === 'unique'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Unique Innovation (Why Us)
            </button>
          </nav>

          {/* Zone 3: Quick Portal Switch CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActivePortal(activePortal === 'admin' ? 'user' : 'admin')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {activePortal === 'admin' ? 'Switch to User Portal' : 'Open HR / Admin Portal'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* =========================================================
            PORTAL 1: NORMAL USER / CANDIDATE PORTAL
           ========================================================= */}
        {activePortal === 'user' && (
          <div className="space-y-8">
            {/* Hero Split Banner */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500">
                    Candidate Portal · Smart Skill-Match & Zero-Ghosting Recruitment System
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                    Enter Your Skills & Experience Once. See Your Instant Match % for Every Company Role.
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Unlike other job apps where you apply blindly and never hear back, VeriHire compares your skills & experience against the HR Manager’s exact specifications in real time—showing you what matches, which skill is missing, and guaranteeing clear HR feedback on every application.
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">Unique Feature:</span> Live Skill-Gap Calculator + Mandatory HR Feedback (Zero Ghosting)
                  </div>
                  <button
                    onClick={() => setActivePortal('unique')}
                    className="font-semibold text-slate-900 underline hover:text-slate-700"
                  >
                    Read Full Problem Statement →
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 rounded-xl overflow-hidden relative min-h-[220px] flex flex-col justify-end border border-slate-200">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_workspace_editorial_1794908211115.jpg"
                    alt="Modern software engineering team workspace"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}
                <div className="relative z-10 p-6 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white space-y-1.5">
                  <p className="text-xs text-slate-300">Direct HR Specification Matching</p>
                  <p className="text-sm font-medium leading-snug">
                    Company HRs post exact required skills and experience. You enter what you know—our MongoDB engine matches both sides automatically.
                  </p>
                </div>
              </div>
            </section>

            {userBannerMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{userBannerMsg}</span>
                </div>
                <button
                  onClick={() => setUserBannerMsg(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Step 1: User Enters Their Skills & Experience */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <span>Your Candidate Profile (Enter What You Know & Your Experience)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your skills or experience below—every job card below will immediately recalculate your Match % and missing skills!
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  Live Smart-Match Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Current Role</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Skills You Know (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={candidateSkillsInput}
                    onChange={(e) => setCandidateSkillsInput(e.target.value)}
                    placeholder="e.g. React, Node.js, MongoDB, Python, SQL"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={candidateExperience}
                    onChange={(e) => setCandidateExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Browse Open Jobs Posted by Company HRs & Apply */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Open Company Jobs ({jobs.length} Roles in MongoDB)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Compare HR specifications with your skills and apply in one click
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search role, company, or skill..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                    {(['All', 'Full-Time', 'Remote', 'Internship'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedJobType(t)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          selectedJobType === t
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
                  Loading jobs from MongoDB...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((job) => {
                    const match = computeClientMatch(
                      job.requiredSkills,
                      job.minExperience,
                      candidateSkillsInput,
                      candidateExperience
                    );

                    return (
                      <article
                        key={job._id}
                        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Top metadata row (Zero-Pill Rule) */}
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <div>
                              <span className="font-semibold text-slate-800">{job.company}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{job.location}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{job.jobType}</span>
                            </div>
                            <span
                              className={`font-mono font-bold tabular-nums ${
                                match.score >= 75
                                  ? 'text-emerald-700'
                                  : match.score >= 50
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {match.score}% Match
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>

                          <p className="text-xs text-slate-600 leading-relaxed">{job.description}</p>

                          {/* HR Specification Details */}
                          <div className="pt-2 space-y-1.5 text-xs">
                            <p className="text-slate-700">
                              <span className="font-semibold text-slate-900">HR Specification: </span>
                              Min <span className="font-mono tabular-nums">{job.minExperience} yrs</span> exp · Salary{' '}
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {job.salaryRange}
                              </span>{' '}
                              · Posted by {job.postedByName} ({job.postedByRole})
                            </p>
                            <p className="text-slate-700">
                              <span className="font-semibold text-slate-900">Required Skills: </span>
                              {job.requiredSkills.join(' · ')}
                            </p>
                          </div>

                          {/* Unique Factor: Instant Skill-Gap Analysis Box */}
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Smart Skill-Gap Analysis (Why VeriHire is Different)</span>
                            </p>
                            <p className="text-slate-600">
                              <span className="font-medium text-emerald-700">Your Matched Skills: </span>
                              {match.matched.length > 0 ? match.matched.join(', ') : 'None yet'}
                            </p>
                            {match.missing.length > 0 ? (
                              <p className="text-slate-600">
                                <span className="font-medium text-amber-700">Skills to Learn for 100% Match: </span>
                                {match.missing.join(', ')}
                              </p>
                            ) : (
                              <p className="text-emerald-700 font-medium">
                                You have 100% of the skills requested by the HR Manager!
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            {candidateExperience >= job.minExperience
                              ? `Experience Met (${candidateExperience} >= ${job.minExperience} yrs)`
                              : `Exp Needed: ${job.minExperience} yrs (You have ${candidateExperience})`}
                          </span>
                          <button
                            onClick={() => setApplyingJob(job)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Apply Now ({match.score}% Match)</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 3: My Submitted Applications & Transparent HR Feedback */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Your Applied Jobs & Transparent HR Feedback ({applications.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Zero Ghosting: Whenever HR shortlists, schedules an interview, or rejects, you see the exact reason here.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">{app.candidateName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{app.educationOrRole}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{app.experienceYears} yrs exp</span>
                        <span aria-hidden="true">·</span>
                        <span>Skills: {app.candidateSkills.join(', ')}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Applied for: {app.jobTitle} at {app.company}
                      </h3>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">HR Feedback / Reason: </span>
                        {app.hrFeedback}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-xs">
                      <div className="text-right">
                        <span className="text-slate-500 block">Smart Match</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {app.matchScore}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Application Status</span>
                        <span
                          className={`font-semibold ${
                            app.status === 'Hired' || app.status === 'Shortlisted' || app.status === 'Interview Scheduled'
                              ? 'text-emerald-700'
                              : app.status === 'Rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            PORTAL 2: ADMIN / COMPANY HR & MANAGER PORTAL
           ========================================================= */}
        {activePortal === 'admin' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  Company Admin Portal · For HR Managers & Engineering Leads
                </p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  HR & Manager Recruitment Console (Post Specifications & Hire Candidates)
                </h1>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {jobs.length} Active Jobs · {applications.length} Candidate Applications
              </span>
            </div>

            {adminBannerMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{adminBannerMsg}</span>
                </div>
                <button
                  onClick={() => setAdminBannerMsg(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: HR Posts Job Requirement / Specification */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>1. Post Company Job Specification</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    HR / Manager enters what skills and experience the company needs
                  </p>
                </div>

                <form onSubmit={handlePostJobByHR} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Python Backend Developer"
                        value={hrJobTitle}
                        onChange={(e) => setHrJobTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Infosys / Zomato"
                        value={hrCompany}
                        onChange={(e) => setHrCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">HR / Manager Name</label>
                      <input
                        type="text"
                        required
                        value={hrName}
                        onChange={(e) => setHrName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        required
                        value={hrRole}
                        onChange={(e) => setHrRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Required Skills (Comma Separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={hrRequiredSkills}
                      onChange={(e) => setHrRequiredSkills(e.target.value)}
                      placeholder="e.g. React, Node.js, MongoDB, SQL"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Min Exp (Yrs)</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        required
                        value={hrMinExp}
                        onChange={(e) => setHrMinExp(Number(e.target.value))}
                        className="w-full px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Job Type</label>
                      <select
                        value={hrJobType}
                        onChange={(e) => setHrJobType(e.target.value as Job['jobType'])}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Remote">Remote</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        required
                        value={hrLocation}
                        onChange={(e) => setHrLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Salary Package</label>
                    <input
                      type="text"
                      required
                      value={hrSalary}
                      onChange={(e) => setHrSalary(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Job Description / Role Requirements
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={hrDescription}
                      onChange={(e) => setHrDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={postingJob}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{postingJob ? 'Saving to MongoDB...' : 'Publish Job Requirement to MongoDB'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: HR Reviews Candidates, Sees Auto-Match %, and Shortlists/Hires */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      2. Candidate Applications (Sorted by Skill & Experience Match)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Review what skills and experience each applicant has and update their recruitment status
                    </p>
                  </div>

                  <select
                    value={adminFilterJobId}
                    onChange={(e) => setAdminFilterJobId(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="All">All Company Jobs ({applications.length})</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title} — {j.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredAdminApplications.map((app) => (
                    <div
                      key={app._id}
                      className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-bold text-slate-900 text-sm">{app.candidateName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{app.candidateEmail}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{app.experienceYears} Years Experience</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1">
                            Applied Role: {app.jobTitle} ({app.company}) · {app.educationOrRole}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums block">
                            {app.matchScore}% Auto-Match
                          </span>
                          <span className="text-xs text-slate-500">Status: {app.status}</span>
                        </div>
                      </div>

                      {/* Candidate's Skills vs Company Requirement */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            Skills Candidate Knows:
                          </span>
                          <span className="text-slate-700">{app.candidateSkills.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            Skill Match Breakdown:
                          </span>
                          <span className="text-emerald-700">
                            Matched: {app.matchedSkills.length > 0 ? app.matchedSkills.join(', ') : 'None'}
                          </span>
                          {app.missingSkills.length > 0 && (
                            <span className="block text-amber-700">
                              Missing: {app.missingSkills.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* HR Feedback Input + 1-Click Status Buttons */}
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            HR Feedback / Reason for Candidate (Visible on User Portal):
                          </label>
                          <input
                            type="text"
                            value={
                              feedbackDrafts[app._id] !== undefined
                                ? feedbackDrafts[app._id]
                                : app.hrFeedback
                            }
                            onChange={(e) =>
                              setFeedbackDrafts((prev) => ({ ...prev, [app._id]: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleUpdateCandidateStatus(app, 'Shortlisted')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              app.status === 'Shortlisted'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateCandidateStatus(app, 'Interview Scheduled')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              app.status === 'Interview Scheduled'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Schedule Interview
                          </button>
                          <button
                            onClick={() => handleUpdateCandidateStatus(app, 'Hired')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              app.status === 'Hired'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            Hire Candidate
                          </button>
                          <button
                            onClick={() => handleUpdateCandidateStatus(app, 'Rejected')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              app.status === 'Rejected'
                                ? 'bg-red-700 text-white border-red-700'
                                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            Reject (With Skill Feedback)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            PORTAL 3: UNIQUE FACTOR (FOR ASSIGNMENT PRESENTATION)
           ========================================================= */}
        {activePortal === 'unique' && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Assignment Problem Statement · Why VeriHire is Better Than Traditional Job Portals
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                What Problem Does VeriHire Solve That Other Job Apps Don’t?
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                In normal job apps (like LinkedIn, Naukri, or Indeed), recruitment is broken for both sides: candidates apply blindly without knowing if their skills match, and 78% of candidates are "ghosted" (rejected without ever knowing why). Meanwhile, HR managers have to manually read hundreds of unranked resumes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-mono font-semibold text-slate-900">01. Live Skill-Gap Calculator</p>
                  <h2 className="text-base font-bold text-slate-900">
                    Candidates See What Matches & Which Skill to Learn
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Other apps just have an "Apply" button. VeriHire compares the user's skills & experience with the HR's specification in real time—showing the exact Match % (e.g., 85%) and telling the candidate which missing skill (e.g., TypeScript or Docker) will make them a 100% match.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-mono font-semibold text-slate-900">02. Zero-Ghosting Mandatory Feedback</p>
                  <h2 className="text-base font-bold text-slate-900">
                    Every Candidate Gets a Clear Reason from HR
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Other apps leave candidates in "Applied" status forever. In VeriHire, whenever HR shortlists or rejects an applicant in the Admin Portal, our Express + MongoDB backend attaches a clear, constructive reason so the candidate knows exactly where they stand.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-mono font-semibold text-slate-900">03. Auto-Ranked HR Shortlisting</p>
                  <h2 className="text-base font-bold text-slate-900">
                    Instant Specification Matching for HR & Managers
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Company HR/Managers simply enter their required skills and minimum experience in the Admin Portal. MongoDB stores the specification and automatically computes each applicant's `matchScore`, `matchedSkills`, and `missingSkills`.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Apply Confirmation Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs text-slate-500">{applyingJob.company} · {applyingJob.location}</p>
                <h2 className="text-base font-bold text-slate-900">Apply for {applyingJob.title}</h2>
              </div>
              <button
                onClick={() => setApplyingJob(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Years of Experience *</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    required
                    value={candidateExperience}
                    onChange={(e) => setCandidateExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Your Skills (Comma Separated) *
                </label>
                <input
                  type="text"
                  required
                  value={candidateSkillsInput}
                  onChange={(e) => setCandidateSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Short Note About Your Experience / Projects
                </label>
                <textarea
                  rows={2}
                  value={candidateBio}
                  onChange={(e) => setCandidateBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  {submittingApp ? 'Submitting to MongoDB...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-900">VeriHire</span> · Smart Skill-Match & Zero-Ghosting Recruitment System (React + Express + MongoDB)
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActivePortal('user')} className="hover:text-slate-900">
              User Portal
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePortal('admin')} className="hover:text-slate-900">
              Admin / HR Portal
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePortal('unique')} className="hover:text-slate-900">
              Why VeriHire is Unique
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
