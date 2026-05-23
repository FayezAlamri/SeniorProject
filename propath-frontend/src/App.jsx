import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import JobSeekerDashboard from "./pages/JobSeekerDashboard"
import EmployerDashboard from "./pages/EmployerDashboard"
import PostJob from "./pages/PostJob"
import JobBoard from "./pages/JobBoard"
import Applicants from "./pages/Applicants"

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/home" element={<Home />} />

      <Route path="/jobseeker" element={<JobSeekerDashboard />} />

      <Route path="/employer" element={<EmployerDashboard />} />

      {/* New routes */}
      <Route path="/post-job" element={<PostJob />} />

      <Route path="/jobs" element={<JobBoard />} />

      <Route path="/applicants" element={<Applicants />} />

    </Routes>
  )
}

export default App
