import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import { supabase } from "../supabaseClient"

function PostJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    salary_range: "",
    description: "",
    requirements: "",
    status: "open",
  })

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
    setError("")
    if (!form.title.trim()) { setError("Job title is required"); return }
    if (!form.company.trim()) { setError("Company name is required"); return }
    if (!form.description.trim()) { setError("Job description is required"); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate("/login"); return }

    const { error: insertError } = await supabase.from("jobs").insert({
      employer_id: user.id,
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      job_type: form.job_type,
      salary_range: form.salary_range.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      status: form.status,
    })

    setLoading(false)

    if (insertError) {
      setError("Failed to post job: " + insertError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate("/employer"), 1800)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#eaf2f7] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Posted!</h2>
          <p className="text-gray-500">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#eaf2f7]">

      {/* NAVBAR — unified component */}
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Post a New Job</h1>
          <p className="text-gray-500">Fill in the details to attract the right candidates</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.company}
              onChange={set("company")}
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
            />
          </div>

          {/* Location + Job Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={set("location")}
                placeholder="e.g. Riyadh, KSA or Remote"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Type</label>
              <select
                value={form.job_type}
                onChange={set("job_type")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
                <option>Freelance</option>
                <option>Remote</option>
              </select>
            </div>
          </div>

          {/* Salary + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Salary Range</label>
              <input
                type="text"
                value={form.salary_range}
                onChange={set("salary_range")}
                placeholder="e.g. 8,000 – 12,000 SAR/mo"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white"
              >
                <option value="open">Open (live)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={5}
              placeholder="Describe the role, responsibilities, and what a typical day looks like…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 resize-none"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Requirements & Skills</label>
            <textarea
              value={form.requirements}
              onChange={set("requirements")}
              rows={4}
              placeholder="List the must-have skills, qualifications, and experience…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
            >
              {loading ? "Posting…" : "Post Job"}
            </button>
            <Link to="/employer">
              <button className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium">
                Cancel
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default PostJob