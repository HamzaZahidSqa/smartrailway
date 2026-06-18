import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import BookingStatusBadge from '../components/BookingStatusBadge'
import toast from 'react-hot-toast'
import { FaTrain, FaTicketAlt, FaHistory, FaUser, FaTimes } from 'react-icons/fa'

export default function Dashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('upcoming')

  const load = () => {
    setLoading(true)
    api.get('/bookings/my')
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`)
      toast.success(`Cancelled. Refund: ₹${data.refundAmount}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    }
  }

  const now = new Date()
  const upcoming  = bookings.filter(b => b.status !== 'Cancelled' && new Date(b.travelDate) >= now)
  const history   = bookings.filter(b => b.status === 'Cancelled' || new Date(b.travelDate) < now)
  const displayed = tab === 'upcoming' ? upcoming : history

  const stats = [
    { label:'Total Bookings', value: bookings.length, icon:<FaTicketAlt/>, color:'blue' },
    { label:'Upcoming Trips', value: upcoming.length, icon:<FaTrain/>, color:'green' },
    { label:'Past Trips',     value: history.length,  icon:<FaHistory/>, color:'purple' },
    { label:'Cancelled',      value: bookings.filter(b => b.status==='Cancelled').length, icon:<FaTimes/>, color:'red' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-bold text-${s.color}-600 mb-1`}>{s.value}</div>
            <div className="text-gray-500 text-sm flex items-center justify-center gap-1">{s.icon} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[['upcoming','Upcoming Trips'],['history','Booking History']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === v ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {/* Bookings */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FaTicketAlt className="text-5xl mx-auto mb-3"/>
          <p>{tab === 'upcoming' ? 'No upcoming trips.' : 'No booking history.'}</p>
          <Link to="/" className="btn-primary inline-block mt-4">Search Trains</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(b => (
            <div key={b._id} className="card hover:shadow-lg transition-shadow border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTrain className="text-blue-600"/>
                    <span className="font-bold text-blue-800">{b.train?.trainName}</span>
                    <span className="text-gray-500 text-sm">#{b.train?.trainNumber}</span>
                    <BookingStatusBadge status={b.status}/>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{b.fromCity} → {b.toCity}</span>
                    <span>|</span>
                    <span>{new Date(b.travelDate).toDateString()}</span>
                    <span>|</span>
                    <span>{b.coach?.coachType}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    PNR: <span className="font-mono font-semibold text-blue-600">{b.pnr}</span>
                    &nbsp;|&nbsp; Seats: {b.seats?.join(', ')}
                    &nbsp;|&nbsp; {b.passengers?.length} Passenger(s)
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className="text-xl font-bold text-green-600">₹{b.totalFare}</span>
                  <div className="flex gap-2">
                    <Link to={`/ticket/${b._id}`} className="btn-secondary text-xs px-3 py-1.5">View Ticket</Link>
                    {b.status === 'Confirmed' && new Date(b.travelDate) > now && (
                      <button onClick={() => cancel(b._id)} className="btn-danger text-xs px-3 py-1.5">Cancel</button>
                    )}
                  </div>
                  {b.status === 'Cancelled' && b.refundAmount > 0 && (
                    <p className="text-xs text-green-600">Refund: ₹{b.refundAmount}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
