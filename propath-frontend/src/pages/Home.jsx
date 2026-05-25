import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"

function Home() {
  return (
    <div>

      {/* NAVBAR — unified component */}
      <Navbar />

      {/* HERO SECTION */}
      <div className="text-center py-20 bg-[#eaf2f7]">

        <h1 className="text-5xl font-bold mb-6">
          Transform Your Career with
          <span className="text-teal-600"> ProPath AI</span>
        </h1>

        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          Intelligent CV analysis, skill gap detection, and personalized career recommendations.
        </p>

        <div className="flex justify-center gap-4">

          <Link
            to="/jobseeker"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg"
          >
            I'm a Job Seeker
          </Link>

          <Link
            to="/employer"
            className="border border-teal-600 text-teal-600 px-6 py-3 rounded-lg"
          >
            I'm an Employer
          </Link>

          <Link
            to="/jobs"
            className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg hover:border-teal-400 transition"
          >
            Browse Jobs
          </Link>

        </div>

      </div>


      {/* FEATURES */}
      <div id="features" className="py-20 px-10 text-center">

        <h2 className="text-3xl font-bold mb-10">
          How ProPath AI Works
        </h2>

        <div className="grid grid-cols-3 gap-8">

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">
              AI CV Analysis
            </h3>
            <p className="text-gray-500">
              Upload your CV and let AI analyze your skills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">
              Skill Gap Detection
            </h3>
            <p className="text-gray-500">
              Compare your skills with job requirements.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">
              Personalized Roadmap
            </h3>
            <p className="text-gray-500">
              Get recommendations to improve your career.
            </p>
          </div>

        </div>

      </div>


      {/* CTA SECTION */}
      <div id="contact" className="bg-teal-600 text-center py-20 text-white">

        <h2 className="text-4xl font-bold mb-4">
          Ready to Transform Your Career?
        </h2>

        <p className="mb-8">
          Join thousands of job seekers using ProPath AI
        </p>

        <Link
          to="/register"
          className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold"
        >
          Get Started Now
        </Link>

      </div>

    </div>
  )
}

export default Home