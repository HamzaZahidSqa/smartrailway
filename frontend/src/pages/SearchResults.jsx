import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import TrainCard from '../components/TrainCard'
import { FaSearch, FaTrain } from 'react-icons/fa'

export default function SearchResults() {
  const [params] = useSearchParams()
  const from       = params.get('from') || ''
  const to         = params.get('to')   || ''
  const date       = params.get('date') || ''
  const passengers = params.get('passengers') || 1

  const [trains, setTrains]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    setLoading(true)
    api.get(`/trains/search?source=${from}&destination=${to}&date=${date}&passengers=${passengers}`)
      .then(r => setTrains(r.data.trains || []))
      .catch(() => setTrains([]))
      .finally(() => setLoading(false))
  }, [from, to, date, passengers])

  const classes = ['All', 'Economy', 'Sleeper', 'Business', 'Executive']
  const filtered = filter === 'All' ? trains : trains.filter(t => t.coaches?.some(c => c.coachType === filter && c.availableSeats > 0))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Summary */}
      <div className="bg-blue-700 text-white rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <FaSearch/>
        <span className="font-semibold">{from} → {to}</span>
        <span>|</span>
        <span>{new Date(date).toDateString()}</span>
        <span>|</span>
        <span>{passengers} Passenger(s)</span>
      </div>

      {/* Class filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {classes.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaTrain className="text-6xl mx-auto mb-4 text-gray-300"/>
          <p className="text-xl font-semibold">No trains found</p>
          <p className="text-sm mt-2">Try different cities or dates</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">{filtered.length} train(s) found</p>
          {filtered.map(t => (
            <TrainCard key={t._id} train={t} searchParams={{ from, to, date, passengers }}/>
          ))}
        </div>
      )}
    </div>
  )
}
