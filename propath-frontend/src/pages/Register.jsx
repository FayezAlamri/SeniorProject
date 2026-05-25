import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

function Register() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("jobseeker")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // If already logged in, redirect away from register page
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        navigate(profile?.role === "employer" ? "/employer" : "/jobseeker", { replace: true })
      }
    })
  }, [navigate])

  const handleSubmit = async () => {
    setError("")
    setSuccessMessage("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!firstName.trim()) { setError("Please enter your first name"); return }
    if (!emailRegex.test(email)) { setError("Please enter a valid email"); return }
    if (email !== confirmEmail) { setError("Emails do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter"); return }
    if (!/[0-9]/.test(password)) { setError("Password must contain a number"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { role } } })

    if (signUpError) {
      setLoading(false)
      const msg = signUpError.message.toLowerCase()
      if (msg.includes("user already registered") || msg.includes("already registered")) {
        setError("An account with this email already exists. Please sign in instead.")
      } else if (msg.includes("rate limit") || msg.includes("email rate")) {
        setError("Too many attempts. Please wait a few minutes and try again.")
      } else {
        setError(signUpError.message)
      }
      return
    }

    if (!data?.user?.id) {
      setLoading(false)
      setError("An account with this email already exists. Please sign in instead.")
      return
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        role,
      })

    setLoading(false)

    if (profileError) {
      setError("Account created but profile save failed: " + profileError.message)
      return
    }

    setSuccessMessage(
      "Account created! Please check your email and click the confirmation link before signing in."
    )
    setTimeout(() => navigate("/login"), 4000)
  }

  return (
    <div className="min-h-screen bg-[#eaf2f7] flex">

      {/* LEFT SIDE */}
      <div className="w-1/2 flex flex-col justify-center px-20">
        <Link to="/home" className="flex items-center gap-3 mb-12">
          <div className="bg-teal-600 w-10 h-10 rounded-xl" />
          <h2 className="text-2xl font-bold">ProPath AI</h2>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Join Us Now</h1>
        <p className="text-gray-600 text-lg">Your journey starts here</p>
        <div className="mt-10 flex flex-col gap-3 max-w-xs">
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <span className="text-teal-600 text-lg">✓</span> AI-powered CV analysis
          </div>
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <span className="text-teal-600 text-lg">✓</span> Skill gap detection
          </div>
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <span className="text-teal-600 text-lg">✓</span> Personalized career roadmap
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-1/2 flex items-center justify-center py-10">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-[420px]">

          <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
          <p className="text-gray-500 mb-6">Fill in your details to get started</p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-1/2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-1/2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setRole("jobseeker")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                role === "jobseeker"
                  ? "bg-teal-600 text-white border-teal-600"
                  : "text-gray-600 border-gray-300 hover:border-teal-400"
              }`}
            >
              Job Seeker
            </button>
            <button
              onClick={() => setRole("employer")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                role === "employer"
                  ? "bg-teal-600 text-white border-teal-600"
                  : "text-gray-600 border-gray-300 hover:border-teal-400"
              }`}
            >
              Employer
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="email"
              placeholder="Confirm Email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="password"
              placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 bg-teal-50 border border-teal-300 text-teal-700 rounded-lg p-3 text-sm">
              {successMessage}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !!successMessage}
            className="w-full mt-5 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-60 font-semibold"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>

          <p className="text-sm mt-4 text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link to="/home" className="text-xs text-gray-400 hover:text-teal-600 transition">
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}

export default Register