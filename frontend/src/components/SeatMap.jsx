import { useState, useEffect } from 'react'
import api from '../services/api'

export default function SeatMap({ coachId, travelDate, maxSelect, onSeatsChange }) {
  const [seats, setSeats]       = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!coachId) return
    setLoading(true)
    setSelected([])
    api.get(`/seats?coachId=${coachId}&date=${travelDate}`)
      .then(r => setSeats(r.data.seats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [coachId, travelDate])

  const toggle = (seat) => {
    if (seat.status === 'Booked') return
    setSelected(prev => {
      let next
      if (prev.find(s => s.seatNumber === seat.seatNumber)) {
        next = prev.filter(s => s.seatNumber !== seat.seatNumber)
      } else {
        if (prev.length >= maxSelect) {
          next = [...prev.slice(1), seat]
        } else {
          next = [...prev, seat]
        }
      }
      onSeatsChange(next)
      return next
    })
  }

  const color = (seat) => {
    if (selected.find(s => s.seatNumber === seat.seatNumber)) return 'bg-blue-500 text-white border-blue-600'
    if (seat.status === 'Booked') return 'bg-red-400 text-white border-red-500 cursor-not-allowed'
    return 'bg-green-400 hover:bg-green-500 text-white border-green-500 cursor-pointer'
  }

  if (loading) return <div className="text-center py-6 text-gray-500">Loading seats...</div>

  const rows = seats.reduce((acc, s) => { (acc[s.row] = acc[s.row] || []).push(s); return acc }, {})

  return (
    <div>
      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-400 inline-block"/> Available</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-400 inline-block"/> Booked</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-500 inline-block"/> Selected</span>
      </div>

      <div className="bg-gray-100 rounded-xl p-4 overflow-auto max-h-80">
        <div className="flex justify-center gap-4 mb-2 text-xs font-semibold text-gray-500">
          <span>A</span><span>B</span><span className="ml-6">C</span><span>D</span>
        </div>
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className="flex justify-center items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 w-5 text-right">{row}</span>
            {rowSeats.slice(0,2).map(s => (
              <button key={s.seatNumber} onClick={() => toggle(s)}
                className={`w-9 h-9 rounded border-2 text-xs font-bold transition-all ${color(s)}`}
                title={s.seatNumber}>
                {s.column}
              </button>
            ))}
            <div className="w-6"/>
            {rowSeats.slice(2,4).map(s => (
              <button key={s.seatNumber} onClick={() => toggle(s)}
                className={`w-9 h-9 rounded border-2 text-xs font-bold transition-all ${color(s)}`}
                title={s.seatNumber}>
                {s.column}
              </button>
            ))}
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="mt-2 text-sm text-blue-600 font-medium">
          Selected: {selected.map(s => s.seatNumber).join(', ')}
        </p>
      )}
    </div>
  )
}
