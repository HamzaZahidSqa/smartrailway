import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import BookingStatusBadge from '../components/BookingStatusBadge'
import { FaTrain, FaCheckCircle, FaDownload } from 'react-icons/fa'

export default function BookingConfirmation() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [ticket,  setTicket]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(r => { setBooking(r.data.booking); setTicket(r.data.ticket) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>
  if (!booking) return <div className="text-center py-20 text-red-500">Booking not found</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-3"/>
        <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h1>
        <p className="text-gray-500">Your ticket has been booked successfully</p>
      </div>

      <div className="card border-2 border-green-200">
        {/* Ticket header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-dashed border-gray-300">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">PNR Number</p>
            <p className="text-2xl font-bold text-blue-700">{booking.pnr}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ticket No.</p>
            <p className="font-mono font-semibold">{ticket?.ticketNumber}</p>
          </div>
          <BookingStatusBadge status={booking.status}/>
        </div>

        {/* Train info */}
        <div className="flex items-center gap-2 mb-4 text-blue-800">
          <FaTrain/>
          <span className="font-bold">{booking.train?.trainName}</span>
          <span className="text-gray-500 text-sm">#{booking.train?.trainNumber}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="font-bold text-gray-800">{booking.fromCity}</p>
            <p className="text-sm text-blue-600">{booking.train?.departureTime}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium text-sm">{new Date(booking.travelDate).toDateString()}</p>
            <div className="border-t border-dashed border-gray-300 my-2"/>
            <p className="text-xs text-gray-500">{booking.coach?.coachType}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">To</p>
            <p className="font-bold text-gray-800">{booking.toCity}</p>
            <p className="text-sm text-blue-600">{booking.train?.arrivalTime}</p>
          </div>
        </div>

        {/* Passengers */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Passengers</p>
          <div className="space-y-2">
            {booking.passengers?.map((p, i) => (
              <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500">{p.age}y, {p.gender}</span>
                <span className="text-blue-600 font-mono">{p.seatNumber || booking.seats?.[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fare */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="font-semibold text-gray-700">Total Paid</span>
          <span className="text-2xl font-bold text-green-600">₹{booking.totalFare}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link to={`/ticket/${booking._id}`} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
          <FaDownload/> View / Download Ticket
        </Link>
        <Link to="/dashboard" className="btn-secondary flex-1 flex items-center justify-center py-3">My Bookings</Link>
      </div>
    </div>
  )
}
