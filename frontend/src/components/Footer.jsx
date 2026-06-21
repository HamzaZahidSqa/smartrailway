import { FaTrain, FaArrowLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  return (
    <footer className="bg-blue-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
        >
          <FaArrowLeft /> Go Back
        </button>
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaTrain className="text-yellow-300 text-xl" />
          <span className="font-bold text-lg">Smart Railway Reservation System</span>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} SmartRail. All rights reserved.</p>
      </div>
    </footer>
  )
}
