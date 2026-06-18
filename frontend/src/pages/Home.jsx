import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTrain, FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaArrowLeft } from 'react-icons/fa'

const CITIES = ['Karachi','Lahore','Islamabad','Peshawar','Multan','Faisalabad','Quetta','Rawalpindi','Sialkot','Hyderabad']

const POPULAR_ROUTES = [
  ['Karachi',   'Lahore'],
  ['Lahore',    'Islamabad'],
  ['Karachi',   'Islamabad'],
  ['Lahore',    'Peshawar'],
  ['Islamabad', 'Multan'],
  ['Karachi',   'Faisalabad'],
  ['Lahore',    'Quetta'],
  ['Peshawar',  'Islamabad'],
]

export default function Home() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({ from: '', to: '', date: today, passengers: 1 })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const search = (e) => {
    e.preventDefault()
    if (!form.from || !form.to) return
    navigate(`/search?from=${form.from}&to=${form.to}&date=${form.date}&passengers=${form.passengers}`)
  }

  return (
    <div>
      {/* Hero */}
       <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white py-20 px-4 relative">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 text-white hover:text-yellow-300"><FaArrowLeft className="text-2xl"/></button>
         <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <FaTrain className="text-yellow-300 text-6xl"/>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Smart Railway Reservation</h1>
          <p className="text-blue-200 text-lg mb-10">Book train tickets effortlessly across Pakistan</p>

          <form onSubmit={search} className="bg-white rounded-2xl p-6 shadow-2xl text-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><FaMapMarkerAlt className="text-blue-500"/> From</label>
                <select className="input-field" value={form.from} onChange={e => set('from', e.target.value)} required>
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><FaMapMarkerAlt className="text-red-500"/> To</label>
                <select className="input-field" value={form.to} onChange={e => set('to', e.target.value)} required>
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><FaCalendarAlt className="text-green-500"/> Date</label>
                <input type="date" className="input-field" value={form.date} min={today}
                  onChange={e => set('date', e.target.value)} required/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><FaUsers className="text-purple-500"/> Passengers</label>
                <input type="number" className="input-field" value={form.passengers} min={1} max={6}
                  onChange={e => set('passengers', Number(e.target.value))} required/>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-4 text-lg py-3 flex items-center justify-center gap-2">
              <FaSearch/> Search Trains
            </button>
          </form>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">Why Choose SmartRail?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon:'🚄', title:'Fast Booking', desc:'Book tickets in under 2 minutes with our streamlined process' },
            { icon:'💺', title:'Seat Selection', desc:'Choose your preferred seat from an interactive coach map' },
            { icon:'🎫', title:'Instant Ticket', desc:'Get your ticket instantly with PNR number via our portal' },
            { icon:'🔒', title:'Secure Payment', desc:'100% secure transactions with multiple payment options' },
            { icon:'📱', title:'Mobile Friendly', desc:'Book and manage tickets from any device, anywhere' },
            { icon:'↩️', title:'Easy Cancellation', desc:'Cancel anytime with transparent refund policy' },
          ].map(f => (
            <div key={f.title} className="card text-center hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular routes */}
      <div className="bg-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Popular Routes</h2>
          <p className="text-center text-gray-400 text-sm mb-8">Click a route to search trains instantly</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map(([f, t]) => (
              <button
                key={f + t}
                onClick={() => {
                  setForm(p => ({ ...p, from: f, to: t }))
                  navigate(`/search?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}&date=${today}&passengers=1`)
                }}
                className="card group flex flex-col items-center gap-1 py-4 hover:bg-blue-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-200 uppercase tracking-wide">From</span>
                <span className="font-bold text-gray-800 group-hover:text-white text-sm text-center">{f}</span>
                <span className="text-blue-500 group-hover:text-blue-200 text-lg">↓</span>
                <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-200 uppercase tracking-wide">To</span>
                <span className="font-bold text-gray-800 group-hover:text-white text-sm text-center">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
