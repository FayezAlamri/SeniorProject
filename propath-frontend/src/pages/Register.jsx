import Navbar from "../components/Navbar"
import { useState } from "react"
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
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!firstName.trim()) { setError("Please enter your first name"); return }
    if (!emailRegex.test(email)) { setError("Please enter a valid email"); return }
    if (email !== confirmEmail) { setError("Emails do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter"); return }
    if (!/[0-9]/.test(password)) { setError("Password must contain a number"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }

    setLoading(true)

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Save profile with role + name
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

    // 3. Redirect based on role
    if (role === "employer") {
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
          <h1 className="text-4xl font-bold mb-4">Join Us Now</h1>
          <p className="text-gray-600 text-lg">Your journey starts now</p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="bg-white p-10 rounded-2xl shadow-lg w-[420px]">

            <h2 className="text-2xl font-bold mb-2">Sign Up</h2>
            <p className="text-gray-500 mb-6">Create Your Account</p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-1/2 p-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-1/2 p-3 border rounded-lg"
              />
            </div>

            {/* Role selector */}
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

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-3 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Confirm Email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full mb-4 p-3 border rounded-lg"
            />
            <input
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-3 border rounded-lg"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-4 p-3 border rounded-lg"
            />

            {error && (
              <p className="text-red-500 mb-4 text-sm">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className="text-sm mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 font-semibold">
                Sign In
              </Link>
            </p>

          </div>
        </div>

      </div>
    </>
  )
}

export default Register
