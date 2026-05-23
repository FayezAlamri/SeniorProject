import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import JobSeekerDashboard from "./pages/JobSeekerDashboard"
import EmployerDashboard from "./pages/EmployerDashboard"

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/home" element={<Home />} />

      <Route path="/jobseeker" element={<JobSeekerDashboard />} />

      <Route path="/employer" element={<EmployerDashboard />} />

    </Routes>
  )
}

export default App