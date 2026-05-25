import { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../supabaseClient"

function EditProfileModal({ user, initialName, initialPhone, onClose }) {
  const [fullName, setFullName] = useState(initialName || "")
  const [phone, setPhone] = useState(initialPhone || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError("")
    if (!fullName.trim()) { setError("Full name is required"); return }
    setSaving(true)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", user.id)
    setSaving(false)
    if (updateError) { setError(updateError.message); return }
    setSuccess(true)
    setTimeout(() => onClose({ fullName: fullName.trim(), phone: phone.trim() }), 1200)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={() => onClose(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Edit Profile</h2>
        <p className="text-sm text-gray-400 mb-6">{user.email}</p>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-700 font-semibold">Profile updated!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5x xxx xxxx"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => onClose(null)}
                className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Never show logged-in state on auth pages
  const isAuthPage = ["/login", "/register"].includes(location.pathname)

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name, phone")
      .eq("id", userId)
      .single()
    setRole(data?.role || null)
    setProfile(data || null)
    return data
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setRole(null)
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return
    const handler = () => setShowProfileMenu(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [showProfileMenu])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  // Called when modal closes — if saved, update local state immediately (no refetch needed)
  const handleModalClose = (updated) => {
    setShowEditModal(false)
    if (updated) {
      setProfile((prev) => ({ ...prev, full_name: updated.fullName, phone: updated.phone }))
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?"

  return (
    <>
      <div className="flex justify-between items-center px-10 py-4 bg-white shadow-sm sticky top-0 z-50">

        {/* Logo */}
        <Link
          to={user ? (role === "employer" ? "/employer" : "/jobseeker") : "/home"}
          className="flex items-center gap-2"
        >
          <div className="bg-teal-600 w-8 h-8 rounded-lg" />
          <h2 className="font-bold text-lg">ProPath AI</h2>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">

          {user && !isAuthPage ? (
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

              {/* Avatar / profile dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowProfileMenu((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-teal-400 transition bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                    {profile?.full_name?.split(" ")[0] || "Account"}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {profile?.phone && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{profile.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setShowProfileMenu(false); setShowEditModal(true) }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition flex items-center gap-2"
                    >
                      <span>✏️</span> Edit Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/home" className="text-gray-600 hover:text-teal-600 transition text-sm">Home</Link>
              <a href="#features" className="text-gray-600 hover:text-teal-600 transition text-sm">Features</a>
              <a href="#contact" className="text-gray-600 hover:text-teal-600 transition text-sm">Contact</a>
              <Link to="/login" className="text-gray-600 hover:text-teal-600 transition text-sm">Login</Link>
              <Link
                to="/register"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition text-sm"
              >
                Get Started
              </Link>
            </>
          )}

        </div>
      </div>

      {/* Edit Profile Modal — pass already-loaded data directly, no re-fetch */}
      {showEditModal && user && (
        <EditProfileModal
          user={user}
          initialName={profile?.full_name || ""}
          initialPhone={profile?.phone || ""}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}

export default Navbar