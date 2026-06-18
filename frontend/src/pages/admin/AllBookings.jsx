import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import BookingStatusBadge from '../../components/BookingStatusBadge'

export default function AllBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')

  useEffect(() => {
    api.get('/bookings/all').then(r => setBookings(r.data.bookings || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statuses = ['All','Confirmed','WaitingList','Cancelled','Completed']
  const shown = bookings
    .filter(b => filter === 'All' || b.status === filter)
    .filter(b => !search || b.pnr?.includes(search.toUpperCase()) || b.user?.name?.toLowerCase().includes(search.toLowerCase()) || b.train?.trainName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Bookings</h1>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{shown.length} records</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input-field max-w-xs" placeholder="Search PNR, passenger, train..."
          value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-600 text-left">
              <th className="p-3">PNR</th><th className="p-3">Passenger</th><th className="p-3">Train</th>
              <th className="p-3">Route</th><th className="p-3">Date</th><th className="p-3">Class</th>
              <th className="p-3">Seats</th><th className="p-3">Fare</th><th className="p-3">Status</th>
            </tr></thead>
            <tbody>
              {shown.map(b => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-blue-600">{b.pnr}</td>
                  <td className="p-3"><div className="font-medium">{b.user?.name}</div><div className="text-gray-400 text-xs">{b.user?.email}</div></td>
                  <td className="p-3 font-medium">{b.train?.trainName}</td>
                  <td className="p-3 text-gray-500">{b.fromCity} → {b.toCity}</td>
                  <td className="p-3 text-gray-500">{new Date(b.travelDate).toLocaleDateString()}</td>
                  <td className="p-3 text-gray-500">{b.coach?.coachType}</td>
                  <td className="p-3 font-mono text-xs">{b.seats?.join(', ')}</td>
                  <td className="p-3 font-bold text-green-600">₹{b.totalFare}</td>
                  <td className="p-3"><BookingStatusBadge status={b.status}/></td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No bookings found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
