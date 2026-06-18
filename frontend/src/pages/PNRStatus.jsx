import { useState } from 'react'
import api from '../services/api'
import BookingStatusBadge from '../components/BookingStatusBadge'
import { FaSearch, FaTrain } from 'react-icons/fa'

export default function PNRStatus() {
  const [pnr,     setPnr]     = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const search = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await api.get(`/tickets/pnr/${pnr.trim()}`)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'PNR not found')
    } finally { setLoading(false) }
  }

  const b = result?.booking

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <FaTrain className="text-blue-600 text-5xl mx-auto mb-3"/>
        <h1 className="text-3xl font-bold text-gray-800">PNR Status</h1>
        <p className="text-gray-500">Check your booking status with PNR number</p>
      </div>

      <form onSubmit={search} className="flex gap-3 mb-8">
        <input className="input-field flex-1 text-lg" value={pnr} onChange={e => setPnr(e.target.value)}
          placeholder="Enter PNR number (e.g. PNR12345678)" required/>
        <button type="submit" disabled={loading} className="btn-primary px-6 flex items-center gap-2">
          <FaSearch/> {loading ? '...' : 'Check'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-center">{error}</div>}

      {b && (
        <div className="card border-2 border-blue-200">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-gray-300">
            <div>
              <p className="text-xs text-gray-500">PNR</p>
              <p className="text-2xl font-bold text-blue-700">{b.pnr}</p>
            </div>
            <BookingStatusBadge status={b.status}/>
          </div>

          <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold">
            <FaTrain/> {b.train?.trainName} (#{b.train?.trainNumber})
          </div>

          <div className="grid grid-cols-3 text-center bg-blue-50 rounded-xl p-4 mb-4">
            <div>
              <p className="font-bold text-xl">{b.fromCity}</p>
              <p className="text-blue-600">{b.train?.departureTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Travel Date</p>
              <p className="text-sm font-medium">{new Date(b.travelDate).toDateString()}</p>
            </div>
            <div>
              <p className="font-bold text-xl">{b.toCity}</p>
              <p className="text-blue-600">{b.train?.arrivalTime}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Class:</span><span className="font-medium">{b.coach?.coachType} ({b.coach?.coachNumber})</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Seats:</span><span className="font-mono font-medium">{b.seats?.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Passengers:</span><span className="font-medium">{b.passengers?.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Fare:</span><span className="font-bold text-green-600">₹{b.totalFare}</span></div>
            {b.status === 'Cancelled' && <div className="flex justify-between"><span className="text-gray-500">Refund:</span><span className="font-medium text-orange-600">₹{b.refundAmount}</span></div>}
          </div>
        </div>
      )}
    </div>
  )
}
