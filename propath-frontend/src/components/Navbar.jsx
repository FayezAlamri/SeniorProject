import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()
        setRole(profile?.role || null)
      }
    })

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        setRole(profile?.role || null)
      } else {
        setUser(null)
        setRole(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div className="flex justify-between items-center px-10 py-4 bg-white shadow-sm sticky top-0 z-50">

      {/* Logo */}
      <Link to={user ? (role === "employer" ? "/employer" : "/jobseeker") : "/home"} className="flex items-center gap-2">
        <div className="bg-teal-600 text-white p-2 rounded-lg w-8 h-8" />
        <h2 className="font-bold text-lg">ProPath AI</h2>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">

        {user ? (
          // ── LOGGED IN ──
          <>
            {role === "employer" ? (
              <>
                <Link to="/employer" className="text-gray-600 hover:text-teal-600 transition text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/post-job" className="text-gray-600 hover:text-teal-600 transition text-sm font-medium">
                  Post Job
                </Link>
                <Link to="/applicants" className="text-gray-600 hover:text-teal-600 transition text-sm font-medium">
                  Applicants
                </Link>
              </>
            ) : (
              <>
                <Link to="/jobseeker" className="text-gray-600 hover:text-teal-600 transition text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/jobs" className="text-gray-600 hover:text-teal-600 transition text-sm font-medium">
                  Browse Jobs
                </Link>
              </>
            )}

            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-500 transition border border-gray-300 px-4 py-2 rounded-lg"
            >
              Sign Out
            </button>
          </>
        ) : (
          // ── LOGGED OUT ──
          <>
            <Link to="/home" className="text-gray-600 hover:text-teal-600 transition text-sm">Home</Link>
            <a href="#features" className="text-gray-600 hover:text-teal-600 transition text-sm">Features</a>
            <a href="#contact" className="text-gray-600 hover:text-teal-600 transition text-sm">Contact</a>
            <Link to="/login" className="text-gray-600 hover:text-teal-600 transition text-sm">Login</Link>
            <Link to="/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition text-sm">
              Get Started
            </Link>
          </>
        )}

      </div>
    </div>
  )
}

export default Navbar
