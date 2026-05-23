import { useRef, useState } from "react"
import Navbar from "../components/Navbar"

function ScoreRing({ score, label }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#3b82f6" :
    score >= 40 ? "#f59e0b" : "#ef4444"

  const bgColor =
    score >= 80 ? "#d1fae5" :
    score >= 60 ? "#dbeafe" :
    score >= 40 ? "#fef3c7" : "#fee2e2"

  return (
    <div className="flex flex-col items-center justify-center" style={{ background: bgColor, borderRadius: "1rem", padding: "1.25rem 2rem" }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <p className="text-sm font-bold mt-1" style={{ color }}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">CV Score</p>
    </div>
  )
}

function DemandBadge({ trend }) {
  const styles = {
    High: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-red-100 text-red-700",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[trend] || "bg-gray-100 text-gray-600"}`}>
      {trend} Demand
    </span>
  )
}

function JobSeekerDashboard() {
  const fileInputRef = useRef()
  const [fileName, setFileName] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleClick = () => fileInputRef.current.click()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setFileName(selected.name)
    setFile(selected)
    setResult(null)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("cv", file)

      const res = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || "Server error")
      setResult(data)
    } catch (err) {
      setError(err.message || "Something went wrong. Make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const levelColor = (level) => {
    if (!level) return "bg-gray-100 text-gray-600"
    const l = level.toLowerCase()
    if (l.includes("entry")) return "bg-green-100 text-green-700"
    if (l.includes("junior")) return "bg-blue-100 text-blue-700"
    if (l.includes("mid")) return "bg-purple-100 text-purple-700"
    if (l.includes("senior")) return "bg-orange-100 text-orange-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#eaf2f7] px-10 py-12">

        {/* TITLE */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Job Seeker Dashboard</h1>
          <p className="text-gray-600">Upload your CV and let AI guide your career development</p>
        </div>

        {/* UPLOAD BOX */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center bg-white max-w-3xl mx-auto">
          <div className="text-4xl mb-4">⬆️</div>
          <h2 className="text-xl font-semibold mb-2">Upload Your CV for AI Analysis</h2>
          <p className="text-gray-500 mb-6">PDF format • AI will extract skills, gaps, and career guidance</p>

          <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          <button onClick={handleClick} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700">
            Choose File
          </button>

          {fileName && (
            <p className="mt-4 text-gray-600">
              Selected: <span className="font-semibold">{fileName}</span>
            </p>
          )}

          {file && !loading && (
            <button onClick={handleAnalyze} className="mt-4 ml-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Analyze CV
            </button>
          )}

          {loading && (
            <div className="mt-6">
              <p className="text-teal-600 font-medium animate-pulse mb-2">
                Running deep 2-pass analysis — this takes ~20 seconds...
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-left max-w-md mx-auto">
              <p className="text-red-700 font-semibold text-sm mb-1">❌ Invalid File</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* RESULTS */}
        {result && (
          <div className="max-w-3xl mx-auto mt-10 space-y-6">

            {/* Header card: name, domain, score */}
            <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{result.name || "Candidate"}</h2>
                <p className="text-gray-500 mt-1">
                  Target Domain: <span className="text-teal-700 font-semibold">{result.targetDomain}</span>
                </p>
                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${levelColor(result.currentLevel)}`}>
                  {result.currentLevel} Level
                </span>
              </div>
              {result.score != null && (
                <ScoreRing score={result.score} label={result.scoreLabel || ""} />
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">📋 Critical Assessment</h3>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-3">✅ Genuine Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-500 mt-0.5">●</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Skills */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-1">⚠️ Skills You Need to Build</h3>
              <p className="text-sm text-gray-400 mb-3">Not found in your CV — but required for {result.targetDomain} roles</p>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((skill, i) => (
                  <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-1">🎓 Recommended Courses</h3>
              <p className="text-sm text-gray-400 mb-4">Real courses to close your skill gaps</p>
              <div className="space-y-3">
                {result.courses.map((course, i) => (
                  <div key={i} className="flex justify-between items-center border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="text-sm text-gray-500">
                        {course.platform} • Addresses: <span className="text-teal-600 font-medium">{course.skill}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-teal-600 font-bold whitespace-nowrap">{course.price}</span>
                      {course.url && (
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100"
                        >
                          Search →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Recommendations */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-1">💼 Realistic Job Matches</h3>
              <p className="text-sm text-gray-400 mb-4">Based on your current skills — with honest gaps to close</p>
              <div className="space-y-3">
                {result.jobs.map((job, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold">{job.title}</p>
                      {job.level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(job.level)}`}>
                          {job.level}
                        </span>
                      )}
                      {job.demandTrend && <DemandBadge trend={job.demandTrend} />}
                    </div>
                    <p className="text-sm text-gray-500">{job.match}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-3">🚀 Your 30-Day Action Plan</h3>
                <ol className="space-y-3">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-700 text-sm">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          </div>
        )}

        {/* FEATURES — hide after results load */}
        {!result && (
          <div className="grid grid-cols-3 gap-10 text-center mt-14 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-gray-600">AI-Extracted Skills</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-gray-600">CV Score & Gap Analysis</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📈</div>
              <p className="text-gray-600">30-Day Action Plan</p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default JobSeekerDashboard