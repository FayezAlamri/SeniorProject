import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import { supabase } from "../supabaseClient"

const JOB_TYPES = ["All", "Full-time", "Part-time", "Contract", "Internship", "Freelance", "Remote"]

function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [selectedJob, setSelectedJob] = useState(null)

  // Apply modal state
  const [applying, setApplying] = useState(false)
  const [applyForm, setApplyForm] = useState({ full_name: "", email: "", cv_url: "" })
  const [applyError, setApplyError] = useState("")
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setJobs(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = jobs.filter((j) => {
    const matchSearch =
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "All" || j.job_type === filterType
    return matchSearch && matchType
  })

  const openApply = (job) => {
    setSelectedJob(job)
    setApplying(true)
    setApplyForm({ full_name: "", email: "", cv_url: "" })
    setApplyError("")
    setApplySuccess(false)
  }

  const closeApply = () => {
    setApplying(false)
    setSelectedJob(null)
    setApplySuccess(false)
  }

  const handleApply = async () => {
    setApplyError("")
    if (!applyForm.full_name.trim()) { setApplyError("Your name is required"); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(applyForm.email)) { setApplyError("Please enter a valid email"); return }

    setApplyLoading(true)

    const { error } = await supabase.from("candidates").insert({
      job_id: selectedJob.id,
      employer_id: selectedJob.employer_id,
      full_name: applyForm.full_name.trim(),
      email: applyForm.email.trim(),
      cv_url: applyForm.cv_url.trim() || null,
      status: "new",
      applied_at: new Date().toISOString(),
    })

    setApplyLoading(false)

    if (error) {
      setApplyError("Application failed: " + error.message)
      return
    }

    setApplySuccess(true)
  }

  const jobTypeBadge = (type) => {
    const colors = {
      "Full-time": "bg-teal-100 text-teal-700",
      "Part-time": "bg-blue-100 text-blue-700",
      "Contract": "bg-purple-100 text-purple-700",
      "Internship": "bg-orange-100 text-orange-700",
      "Freelance": "bg-yellow-100 text-yellow-700",
      "Remote": "bg-green-100 text-green-700",
    }
    return colors[type] || "bg-gray-100 text-gray-600"
  }

  return (
    <div className="min-h-screen bg-[#eaf2f7]">

      {/* NAVBAR — unified component */}
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 px-10 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Find Your Next Opportunity</h1>
          <p className="text-gray-500 mb-8">Browse open roles posted by employers on ProPath AI</p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, or location…"
              className="flex-1 px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white shadow-sm"
            />
            <button className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition shadow-sm">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filterType === type
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-teal-400"
              }`}
            >
              {type}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 self-center">
            {filtered.length} {filtered.length === 1 ? "job" : "jobs"} found
          </span>
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">Loading jobs…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No jobs match your search.</p>
            <p className="text-gray-400 text-sm mt-1">Try different keywords or remove filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-transparent hover:border-teal-100"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-lg font-bold text-gray-800">{job.title}</h2>
                      {job.job_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jobTypeBadge(job.job_type)}`}>
                          {job.job_type}
                        </span>
                      )}
                    </div>
                    <p className="text-teal-700 font-semibold text-sm mb-2">{job.company}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      {job.location && <span>📍 {job.location}</span>}
                      {job.salary_range && <span>💰 {job.salary_range}</span>}
                      <span>🗓 {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    {job.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <button
                      onClick={() => openApply(job)}
                      className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition whitespace-nowrap"
                    >
                      Apply Now
                    </button>
                    <button
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      {selectedJob?.id === job.id && !applying ? "Hide details" : "View details"}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedJob?.id === job.id && !applying && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {job.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">About the Role</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                      </div>
                    )}
                    {job.requirements && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Requirements</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
                      </div>
                    )}
                    <button
                      onClick={() => openApply(job)}
                      className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
                    >
                      Apply for this Role →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPLY MODAL */}
      {applying && selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={closeApply}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            {applySuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Sent!</h2>
                <p className="text-gray-500 mb-1">You've applied for <span className="font-semibold text-teal-700">{selectedJob.title}</span></p>
                <p className="text-gray-400 text-sm mb-6">at {selectedJob.company}</p>
                <button
                  onClick={closeApply}
                  className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition"
                >
                  Browse More Jobs
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Apply for this Role</h2>
                <p className="text-teal-700 font-semibold text-sm mb-1">{selectedJob.title}</p>
                <p className="text-gray-400 text-sm mb-6">{selectedJob.company} {selectedJob.location ? `· ${selectedJob.location}` : ""}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={applyForm.full_name}
                      onChange={(e) => setApplyForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={applyForm.email}
                      onChange={(e) => setApplyForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">CV / LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="url"
                      value={applyForm.cv_url}
                      onChange={(e) => setApplyForm((p) => ({ ...p, cv_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourprofile or Google Drive link"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  {applyError && (
                    <p className="text-red-500 text-sm font-medium">{applyError}</p>
                  )}

                  <button
                    onClick={handleApply}
                    disabled={applyLoading}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
                  >
                    {applyLoading ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default JobBoard