import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { supabase } from "../supabaseClient"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // Fetch role from profiles table to redirect correctly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profile?.role === "employer") {
      navigate("/employer")
    } else {
      navigate("/jobseeker")
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#eaf2f7] flex">

        {/* LEFT SIDE */}
        <div className="w-1/2 flex flex-col justify-center px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-teal-600 text-white p-3 rounded-xl"></div>
            <h2 className="text-2xl font-bold">ProPath AI</h2>
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-gray-600 text-lg max-w-md">
            Continue your journey to career excellence with AI-powered insights.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="bg-white p-10 rounded-2xl shadow-lg w-[420px]">

            <h2 className="text-2xl font-bold mb-2">Sign In to Your Account</h2>
            <p className="text-gray-500 mb-6">Enter your credentials to continue</p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full mb-4 p-3 border rounded-lg"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 p-3 border rounded-lg"
            />

            {error && (
              <p className="text-red-500 mb-4 text-sm">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-sm mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-teal-600 font-semibold">
                Create Account
              </Link>
            </p>

          </div>
        </div>

      </div>
    </>
  )
}

export default Login
