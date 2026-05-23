import { Link } from "react-router-dom"

function Navbar() {
  return (
    <div className="flex justify-between items-center px-10 py-4 bg-white shadow">

      <div className="flex items-center gap-2">
        <div className="bg-teal-600 text-white p-2 rounded-lg"></div>
        <h2 className="font-bold text-lg">ProPath AI</h2>
      </div>

      <div className="flex items-center gap-6">

        <Link to="/home" className="text-gray-600">
          Home
        </Link>

        <Link to="/" className="text-gray-600">
          Sign In
        </Link>

        <Link
          to="/register"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg"
        >
          Get Started
        </Link>

      </div>

    </div>
  )
}

export default Navbar