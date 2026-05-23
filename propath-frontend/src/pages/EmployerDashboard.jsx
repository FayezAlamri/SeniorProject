import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { supabase } from "../supabaseClient"

function EmployerDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [activeTab, setActiveTab] = useState("jobs")

  // --- Auth check ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login")
      } else {
        setUser(data.user)
      }
    })
  }, [navigate])

  // --- Load jobs ---
  useEffect(() => {
    if (!user) return
    setLoadingJobs(true)
    supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setJobs(data || [])
        setLoadingJobs(false)
      })
  }, [user])

  // --- Load candidates (for all employer's jobs) ---
  useEffect(() => {
    if (!user) return
    setLoadingCandidates(true)
    supabase
      .from("candidates")
      .select("*, jobs(title)")
      .eq("employer_id", user.id)
      .order("applied_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setCandidates(data || [])
        setLoadingCandidates(false)
      })
  }, [user])

  // --- Update candidate status ---
  const updateCandidateStatus = async (candidateId, newStatus) => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", candidateId)

    if (!error) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      )
    }
  }

  // --- Delete a job ---
  const deleteJob = async (jobId) => {
    if (!confirm("Delete this job posting?")) return
    const { error } = await supabase.from("jobs").delete().eq("id", jobId)
    if (!error) setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }

  // --- Sign out ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    reviewing: "bg-yellow-100 text-yellow-700",
    shortlisted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }

  const jobStatusColors = {
    open: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-600",
    closed: "bg-red-100 text-red-600",
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#eaf2f7] flex flex-col items-center px-6 py-12">

        {/* TITLE */}
        <div className="mb-8 text-center w-full max-w-4xl flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Employer Dashboard</h1>
            <p className="text-gray-600">Manage job posts and find the best candidates with AI</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-red-500 transition border border-gray-300 px-4 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>

        {/* QUICK ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">

          <div className="bg-white p-8 rounded-xl shadow text-center hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Post a Job</h3>
            <p className="text-gray-500 mb-6">Create a new job posting to attract candidates</p>
            <Link to="/post-job">
              <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition">
                Post Job
              </button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow text-center hover:shadow-md transition">
            <div className="text-3xl font-bold text-teal-600 mb-1">{jobs.length}</div>
            <p className="text-gray-500 mb-2">Active job postings</p>
            <div className="text-2xl font-bold text-blue-600">{candidates.length}</div>
            <p className="text-gray-500">Total applicants</p>
          </div>

        </div>

        {/* TABS */}
        <div className="w-full max-w-4xl">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-5 py-2 rounded-lg font-medium transition text-sm ${
                activeTab === "jobs"
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              My Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-5 py-2 rounded-lg font-medium transition text-sm ${
                activeTab === "candidates"
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Candidates ({candidates.length})
            </button>
          </div>

          {/* JOBS TAB */}
          {activeTab === "jobs" && (
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  No jobs posted yet.{" "}
                  <Link to="/post-job" className="text-teal-600 font-semibold">Post your first job →</Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jobStatusColors[job.status] || "bg-gray-100"}`}>
                          {job.status}
                        </span>
                      </div>
                      {job.location && <p className="text-sm text-gray-500 mt-0.5">📍 {job.location}</p>}
                      {job.salary_range && <p className="text-sm text-gray-500">💰 {job.salary_range}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/candidates?job=${job.id}`}>
                        <button className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                          View Applicants
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-sm bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CANDIDATES TAB */}
          {activeTab === "candidates" && (
            <div className="space-y-3">
              {loadingCandidates ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">Loading candidates...</div>
              ) : candidates.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  No candidates yet. Share your job postings to attract applicants.
                </div>
              ) : (
                candidates.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{c.full_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>
                          {c.status}
                        </span>
                        {c.ai_score != null && (
                          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            AI Score: {c.ai_score}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{c.email}</p>
                      {c.jobs?.title && (
                        <p className="text-xs text-gray-400 mt-0.5">Applied for: <span className="font-medium text-gray-600">{c.jobs.title}</span></p>
                      )}
                      {c.ai_summary && (
                        <p className="text-xs text-gray-500 mt-1 max-w-md">{c.ai_summary}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Applied {new Date(c.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <select
                        value={c.status}
                        onChange={(e) => updateCandidateStatus(c.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {c.cv_url && (
                        <a
                          href={c.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100"
                        >
                          View CV →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </>
  )
}

export default EmployerDashboard
