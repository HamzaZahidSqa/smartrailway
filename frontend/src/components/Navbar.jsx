import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaTrain, FaBars, FaTimes, FaArrowLeft } from 'react-icons/fa'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/') }
  const isHome = location.pathname === '/'

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <FaArrowLeft className="text-xs" /> Back
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <FaTrain className="text-yellow-300 text-2xl" />
            <span>SmartRail</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
          <Link to="/search" className="hover:text-yellow-300 transition">Trains</Link>
          <Link to="/pnr-status" className="hover:text-yellow-300 transition">PNR Status</Link>
          {user ? (
            <>
              {user.role === 'admin'
                ? <Link to="/admin" className="hover:text-yellow-300 transition">Admin Panel</Link>
                : <Link to="/dashboard" className="hover:text-yellow-300 transition">My Bookings</Link>
              }
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="hover:text-yellow-300 transition">Login</Link>
              <Link to="/register" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-4 py-1.5 rounded-lg font-semibold transition">Register</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <FaTimes size={20}/> : <FaBars size={20}/>}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-blue-800 px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <Link to="/"          onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">Home</Link>
          <Link to="/search"    onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">Trains</Link>
          <Link to="/pnr-status" onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">PNR Status</Link>
          {user ? (
            <>
              {user.role === 'admin'
                ? <Link to="/admin"     onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">Admin Panel</Link>
                : <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">My Bookings</Link>
              }
              <button onClick={() => { handleLogout(); setOpen(false) }} className="text-left py-2 text-red-300">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="py-2 hover:text-yellow-300">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
