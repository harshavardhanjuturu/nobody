'use client';

import React, { useState } from 'react';
import { createProject } from '@/app/actions/freelance';
import { toggleSectorRegistration } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import { ToastContainer, useToast } from '@/components/Toast';

interface FreelanceProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  duration: string;
  clientName: string;
  clientPhone: string;
  createdAt?: Date | string;
}

interface FreelanceClientProps {
  projects: FreelanceProject[];
  defaultClientName: string;
  defaultClientPhone: string;
  isFreelancer: boolean;
}

const BUDGET_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹1K', min: 0, max: 1000 },
  { label: '₹1K–5K', min: 1000, max: 5000 },
  { label: '₹5K–15K', min: 5000, max: 15000 },
  { label: '₹15K+', min: 15000, max: Infinity },
];

export default function FreelanceClient({
  projects,
  defaultClientName,
  defaultClientPhone,
  isFreelancer,
}: FreelanceClientProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [contactProject, setContactProject] = useState<FreelanceProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registered, setRegistered] = useState(isFreelancer);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [clientName, setClientName] = useState(defaultClientName);
  const [clientPhone, setClientPhone] = useState(defaultClientPhone);

  const selectedRange = BUDGET_RANGES.find((r) => r.label === budgetFilter) || BUDGET_RANGES[0];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBudget =
      project.budget >= selectedRange.min && project.budget <= selectedRange.max;
    return matchesSearch && matchesBudget;
  });

  const handleRegister = async () => {
    setLoadingRegister(true);
    const res = await toggleSectorRegistration('freelancer');
    setLoadingRegister(false);
    if (res.success) {
      setRegistered(true);
      addToast("You're now registered as a Freelancer.", 'success');
      router.refresh();
    } else {
      addToast(res.error || 'Failed to register.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(budget);
    if (!title || !description || !budget || !duration || !clientName || !clientPhone) {
      addToast('Please fill out all fields.', 'error');
      return;
    }
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      addToast('Please enter a valid budget greater than 0.', 'error');
      return;
    }

    setLoading(true);
    const res = await createProject(title, description, parsedBudget, duration, clientName, clientPhone);
    setLoading(false);

    if (res.success) {
      addToast('Gig posted successfully.', 'success');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setBudget('');
      setDuration('');
      router.refresh();
    } else {
      addToast(res.error || 'Failed to post gig.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Register Banner */}
      {!registered && (
        <div className="glass-panel p-5 rounded-24 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white dark:text-black text-[20px]">work</span>
            </div>
            <div>
              <p className="font-bold text-sm text-primary dark:text-white">
                Join the Campus Freelance Economy!
              </p>
              <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                Register as a freelancer to post gigs and connect with student clients.
              </p>
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={loadingRegister}
            className="px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {loadingRegister ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-white">
            Freelance Hub
          </h1>
          <p className="text-sm text-secondary dark:text-[#a4a2a5] mt-1">
            Offer your skills or find peer students for photography, tutoring, coding, and design.
          </p>
        </div>
        <button
          onClick={() => {
            if (!registered) {
              addToast('Register as a Freelancer first to post gigs.', 'info');
              return;
            }
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Post Gig
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-outline pb-5">
        {/* Budget Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {BUDGET_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setBudgetFilter(range.label)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                budgetFilter === range.label
                  ? 'bg-primary dark:bg-white text-white dark:text-black'
                  : 'bg-surface-container-low dark:bg-surface-container-high text-secondary hover:text-primary dark:hover:text-white border border-outline'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search gigs, skills, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white placeholder-secondary/50 border border-transparent focus:border-outline outline-none transition-all"
          />
        </div>
      </div>

      <p className="text-xs text-secondary font-medium -mt-4">
        {filteredProjects.length} gig{filteredProjects.length !== 1 ? 's' : ''} available
      </p>

      {/* Gigs List */}
      <div className="flex flex-col gap-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-40 block mb-2">work_off</span>
            <p className="text-sm font-medium">No gigs match your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setBudgetFilter('All'); }}
              className="mt-3 text-xs text-primary dark:text-white underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="base-card rounded-24 p-6 flex flex-col gap-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold text-lg text-primary dark:text-white leading-snug">
                  {project.title}
                </h3>
                <div className="text-right shrink-0">
                  <p className="font-bold text-xl text-primary dark:text-white">
                    ₹{project.budget.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-secondary font-medium">budget</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  {project.duration}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  {project.clientName}
                </span>
              </div>

              <p className="text-sm text-primary/85 dark:text-white/85 leading-relaxed line-clamp-3">
                {project.description}
              </p>

              <div className="flex justify-end border-t border-outline pt-4">
                <button
                  onClick={() => setContactProject(project)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary dark:bg-white text-white dark:text-black text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Apply Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {contactProject && (
        <>
          <div onClick={() => setContactProject(null)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-5 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-base text-primary dark:text-white">Apply for this Gig</h2>
              <button onClick={() => setContactProject(null)} className="text-secondary hover:text-primary dark:hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-primary dark:text-white">{contactProject.title}</p>
              <div className="flex gap-3 text-xs text-secondary">
                <span>₹{contactProject.budget.toLocaleString('en-IN')}</span>
                <span>·</span>
                <span>{contactProject.duration}</span>
              </div>
            </div>

            <div className="bg-surface-container-low dark:bg-surface-container-high rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Client</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white dark:text-black text-[20px]">person</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary dark:text-white">{contactProject.clientName}</p>
                  <p className="text-xs text-secondary">{contactProject.clientPhone}</p>
                </div>
              </div>
            </div>

            <a
              href={`tel:${contactProject.clientPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call Client
            </a>
          </div>
        </>
      )}

      {/* Post Gig Modal */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0d0d0f] border border-outline rounded-24 p-6 z-50 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-outline">
              <h2 className="font-bold text-lg text-primary dark:text-white">Post a Freelance Gig</h2>
              <button onClick={() => setShowModal(false)} className="text-secondary cursor-pointer hover:text-primary dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Need Event Photographer for Club Night"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Description</label>
                <textarea
                  placeholder="Describe deliverables, skills needed, and requirements in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Budget (₹)</label>
                  <input
                    type="number"
                    step="100"
                    min="1"
                    placeholder="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 days, 1 week"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Your Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Contact Number</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low dark:bg-surface-container-high text-sm text-primary dark:text-white border border-transparent focus:border-outline outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-full bg-primary dark:bg-white text-white dark:text-black font-semibold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? 'Posting Gig...' : 'Post Gig Now'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
