import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { supabase } from "../supabaseClient"

const STATUS_OPTIONS = ["new", "reviewing", "shortlisted", "rejected"]

const statusStyle = {
  new:        { badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",   label: "New" },
  reviewing:  { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500", label: "Reviewing" },
  shortlisted:{ badge: "bg-green-100 text-green-700",  dot: "bg-green-500",  label: "Shortlisted" },
  rejected:   { badge: "bg-red-100 text-red-700",      dot: "bg-red-400",    label: "Rejected" },
}

function StatusBadge({ status }) {
  const s = statusStyle[status] || { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function Applicants() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [updating, setUpdating] = useState(null)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/login")
      else setUser(data.user)
    })
  }, [navigate])

  // Load jobs + candidates
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, company, status")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false })

      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*, jobs(title, company)")
        .eq("employer_id", user.id)
        .order("applied_at", { ascending: false })

      setJobs(jobsData || [])
      setCandidates(candidatesData || [])
      setLoading(false)
    }
    load()
  }, [user])

  const updateStatus = async (candidateId, newStatus) => {
    setUpdating(candidateId)
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", candidateId)
    if (!error) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      )
    }
    setUpdating(null)
  }

  const filtered = candidates.filter((c) => {
    const jobMatch = selectedJobId === "all" || c.job_id === selectedJobId
    const statusMatch = filterStatus === "all" || c.status === filterStatus
    return jobMatch && statusMatch
  })

  const counts = {
    all: candidates.length,
    new: candidates.filter(c => c.status === "new").length,
    reviewing: candidates.filter(c => c.status === "reviewing").length,
    shortlisted: candidates.filter(c => c.status === "shortlisted").length,
    rejected: candidates.filter(c => c.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-[#eaf2f7]">

      {/* NAVBAR — unified component */}
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Applicants</h1>
          <p className="text-gray-500">Review and manage everyone who applied to your job postings</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total",       key: "all",         color: "text-gray-800" },
            { label: "New",         key: "new",         color: "text-blue-600" },
            { label: "Reviewing",   key: "reviewing",   color: "text-yellow-600" },
            { label: "Shortlisted", key: "shortlisted", color: "text-green-600" },
            { label: "Rejected",    key: "rejected",    color: "text-red-500" },
          ].map(({ label, key, color }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition border-2 ${
                filterStatus === key ? "border-teal-500" : "border-transparent"
              }`}
            >
              <div className={`text-2xl font-bold ${color}`}>{counts[key]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="all">All Jobs ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                  filterStatus === s
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-teal-400"
                }`}
              >
                {s === "all" ? "All Statuses" : s}
              </button>
            ))}
          </div>

          <span className="ml-auto text-sm text-gray-400">
            {filtered.length} applicant{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Applicant cards */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">Loading applicants…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No applicants match these filters.</p>
            {candidates.length === 0 && (
              <p className="text-gray-400 text-sm mt-1">Share your job postings to start receiving applications.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl p-5 shadow-sm border-l-4 transition hover:shadow-md ${
                  c.status === "shortlisted" ? "border-green-400" :
                  c.status === "rejected"    ? "border-red-300" :
                  c.status === "reviewing"   ? "border-yellow-400" :
                  "border-blue-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Left: Candidate info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {c.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{c.full_name || "Unknown"}</h3>
                          <StatusBadge status={c.status} />
                          {c.ai_score != null && (
                            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                              AI Score: {c.ai_score}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{c.email}</p>
                      </div>
                    </div>

                    {c.jobs?.title && (
                      <p className="text-xs text-gray-400 mt-1 ml-11">
                        Applied for: <span className="font-semibold text-gray-600">{c.jobs.title}</span>
                        {c.jobs.company && <span className="text-gray-400"> at {c.jobs.company}</span>}
                      </p>
                    )}

                    {c.ai_summary && (
                      <p className="text-xs text-gray-500 mt-2 ml-11 max-w-lg leading-relaxed">{c.ai_summary}</p>
                    )}

                    <p className="text-xs text-gray-400 mt-2 ml-11">
                      Applied {c.applied_at ? new Date(c.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <select
                      value={c.status}
                      disabled={updating === c.id}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>

                    {c.cv_url && (
                      <a
                        href={c.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition font-medium"
                      >
                        View CV →
                      </a>
                    )}

                    {c.status !== "shortlisted" && c.status !== "rejected" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(c.id, "shortlisted")}
                          disabled={updating === c.id}
                          className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                        >
                          ✓ Shortlist
                        </button>
                        <button
                          onClick={() => updateStatus(c.id, "rejected")}
                          disabled={updating === c.id}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Applicants