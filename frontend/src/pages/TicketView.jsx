import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { FaTrain, FaPrint } from 'react-icons/fa'
import BookingStatusBadge from '../components/BookingStatusBadge'

export default function TicketView() {
  const { bookingId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    api.get(`/tickets/booking/${bookingId}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bookingId])

  const print = () => window.print()

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>
  if (!data?.ticket) return <div className="text-center py-20 text-red-500">Ticket not found</div>

  const { ticket } = data
  const booking = ticket.booking

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← My Bookings</Link>
        <button onClick={print} className="btn-primary flex items-center gap-2">
          <FaPrint/> Print Ticket
        </button>
      </div>

      <div ref={printRef} className="card border-2 border-blue-200 print:shadow-none print:border-black">
        {/* Header */}
        <div className="bg-blue-700 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-xl mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaTrain className="text-yellow-300 text-xl"/>
            <span className="font-bold text-lg">Smart Railway Reservation</span>
          </div>
          <BookingStatusBadge status={booking?.status}/>
        </div>

        {/* PNR & Ticket */}
        <div className="flex justify-between mb-6 pb-4 border-b border-dashed border-gray-300">
          <div>
            <p className="text-xs text-gray-500">PNR NUMBER</p>
            <p className="text-2xl font-bold text-blue-700">{ticket.pnr}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">TICKET NO.</p>
            <p className="font-mono font-bold">{ticket.ticketNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Issued: {new Date(ticket.issuedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Train */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Train</p>
          <p className="font-bold text-blue-800 text-lg">{booking?.train?.trainName} &nbsp;
            <span className="text-gray-500 text-sm font-normal">(#{booking?.train?.trainNumber})</span>
          </p>
        </div>

        {/* Journey */}
        <div className="grid grid-cols-3 text-center mb-6 bg-blue-50 rounded-xl p-4">
          <div>
            <p className="font-bold text-xl text-gray-800">{booking?.fromCity}</p>
            <p className="text-blue-600 font-semibold">{booking?.train?.departureTime}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400">Travel Date</p>
            <p className="text-sm font-semibold">{new Date(booking?.travelDate).toDateString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-blue-600"/>
              <div className="w-16 border-t-2 border-dashed border-blue-400"/>
              <FaTrain className="text-blue-600"/>
              <div className="w-16 border-t-2 border-dashed border-blue-400"/>
              <div className="w-2 h-2 rounded-full bg-blue-600"/>
            </div>
          </div>
          <div>
            <p className="font-bold text-xl text-gray-800">{booking?.toCity}</p>
            <p className="text-blue-600 font-semibold">{booking?.train?.arrivalTime}</p>
          </div>
        </div>

        {/* Coach */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">Coach</p>
            <p className="font-bold">{booking?.coach?.coachNumber} — {booking?.coach?.coachType}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">Seats</p>
            <p className="font-bold font-mono">{booking?.seats?.join(', ')}</p>
          </div>
        </div>

        {/* Passengers */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Passenger Details</p>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100 text-gray-600"><th className="p-2 text-left">Name</th><th className="p-2">Age</th><th className="p-2">Gender</th><th className="p-2">Seat</th></tr></thead>
            <tbody>
              {booking?.passengers?.map((p, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2 text-center">{p.age}</td>
                  <td className="p-2 text-center">{p.gender}</td>
                  <td className="p-2 text-center font-mono text-blue-600">{p.seatNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fare */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="font-semibold">Total Fare Paid</span>
          <span className="text-2xl font-bold text-green-600">₹{booking?.totalFare}</span>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">This is a computer-generated ticket. No signature required.</p>
      </div>
    </div>
  )
}
