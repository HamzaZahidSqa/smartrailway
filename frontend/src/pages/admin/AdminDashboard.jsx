import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import BookingStatusBadge from '../../components/BookingStatusBadge'
import { FaTrain, FaTicketAlt, FaRupeeSign, FaRoute, FaChartBar } from 'react-icons/fa'

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [recent,   setRecent]   = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => { setStats(r.data.stats); setRecent(r.data.recentBookings || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>

  const cards = [
    { label:'Total Trains',    value: stats?.totalTrains,    icon:<FaTrain/>,       color:'blue',   link:'/admin/trains' },
    { label:'Total Bookings',  value: stats?.totalBookings,  icon:<FaTicketAlt/>,   color:'green',  link:'/admin/bookings' },
    { label:'Total Revenue',   value:`₹${(stats?.totalRevenue||0).toLocaleString()}`, icon:<FaRupeeSign/>, color:'yellow', link:'/admin/reports' },
    { label:'Active Users',    value: stats?.totalUsers,     icon:<FaRoute/>,       color:'purple', link:'/admin/users' },
    { label:'Confirmed',       value: stats?.confirmed,      icon:<FaTicketAlt/>,   color:'teal',   link:'/admin/bookings' },
    { label:'Cancelled',       value: stats?.cancelled,      icon:<FaTicketAlt/>,   color:'red',    link:'/admin/bookings' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">Smart Railway Reservation System</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/trains"  className="btn-primary flex items-center gap-2"><FaTrain/> Manage Trains</Link>
          <Link to="/admin/reports" className="btn-secondary flex items-center gap-2"><FaChartBar/> Reports</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} to={c.link} className="card text-center hover:shadow-lg transition group">
            <div className={`text-3xl font-bold text-${c.color}-600 mb-1 group-hover:scale-110 transition-transform`}>{c.value}</div>
            <div className="text-gray-500 text-xs flex items-center justify-center gap-1">{c.icon} {c.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label:'Manage Trains',   to:'/admin/trains',   icon:'🚄', desc:'Add, edit, delete trains' },
          { label:'Manage Coaches',  to:'/admin/coaches',  icon:'🚃', desc:'Coach & seat management' },
          { label:'All Bookings',    to:'/admin/bookings', icon:'🎫', desc:'View all reservations' },
          { label:'Users',           to:'/admin/users',    icon:'👥', desc:'View registered users' },
          { label:'Reports',         to:'/admin/reports',  icon:'📊', desc:'Revenue & analytics' },
        ].map(q => (
          <Link key={q.label} to={q.to} className="card text-center hover:shadow-lg hover:bg-blue-50 transition group">
            <div className="text-4xl mb-2">{q.icon}</div>
            <p className="font-semibold text-gray-800">{q.label}</p>
            <p className="text-xs text-gray-400 mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-blue-600 text-sm hover:underline">View All</Link>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left">
                <th className="p-3">PNR</th><th className="p-3">Passenger</th><th className="p-3">Train</th>
                <th className="p-3">Route</th><th className="p-3">Date</th><th className="p-3">Fare</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-blue-600 text-xs">{b.pnr}</td>
                  <td className="p-3 font-medium">{b.user?.name}</td>
                  <td className="p-3">{b.train?.trainName}</td>
                  <td className="p-3 text-gray-500">{b.fromCity} → {b.toCity}</td>
                  <td className="p-3 text-gray-500">{new Date(b.travelDate).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold text-green-600">₹{b.totalFare}</td>
                  <td className="p-3"><BookingStatusBadge status={b.status}/></td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-gray-400">No bookings yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
