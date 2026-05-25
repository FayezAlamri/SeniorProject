import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

// Gets role from user_metadata (no RLS) then falls back to profiles table
async function getUserRole(user) {
  if (user?.user_metadata?.role) return user.user_metadata.role
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  return profile?.role || null
}

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await getUserRole(session.user)
        navigate(role === "employer" ? "/employer" : "/jobseeker", { replace: true })
      }
    })
  }, [navigate])

  const handleLogin = async () => {
    setError("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError("Please enter a valid email"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed") ||
          authError.message.toLowerCase().includes("not confirmed")) {
        setError("Your email address hasn't been confirmed yet. Please check your inbox and click the confirmation link we sent you.")
      } else if (authError.message.toLowerCase().includes("invalid login credentials") ||
                 authError.message.toLowerCase().includes("invalid credentials")) {
        setError("Incorrect email or password. Please try again.")
      } else {
        setError(authError.message)
      }
      return
    }

    const role = await getUserRole(data.user)
    navigate(role === "employer" ? "/employer" : "/jobseeker", { replace: true })
  }

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin() }

  return (
    <div className="min-h-screen bg-[#eaf2f7] flex">

      <div className="w-1/2 flex flex-col justify-center px-20">
        <Link to="/home" className="flex items-center gap-3 mb-12">
          <div className="bg-teal-600 w-10 h-10 rounded-xl" />
          <h2 className="text-2xl font-bold">ProPath AI</h2>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
        <p className="text-gray-600 text-lg max-w-md">
          Continue your journey to career excellence with AI-powered insights.
        </p>
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

      <div className="w-1/2 flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-[420px]">
          <h2 className="text-2xl font-bold mb-2">Sign In to Your Account</h2>
          <p className="text-gray-500 mb-6">Enter your credentials to continue</p>

          <div className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="Email Address"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full mt-6 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-60 font-semibold">
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-sm mt-4 text-center text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">Create Account</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link to="/home" className="text-xs text-gray-400 hover:text-teal-600 transition">← Back to Home</Link>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Login