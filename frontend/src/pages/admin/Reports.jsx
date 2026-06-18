import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FaChartBar, FaRoute, FaCalendarAlt } from 'react-icons/fa'

export default function Reports() {
  const [type,    setType]    = useState('monthly')
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(false)

  const load = (t) => {
    setType(t); setLoading(true)
    api.get(`/admin/reports?type=${t}`).then(r => setData(r.data.data || [])).catch(() => setData([])).finally(() => setLoading(false))
  }

  useEffect(() => load('monthly'), [])

  const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {[['monthly','Monthly Revenue',<FaChartBar/>],['routes','Popular Routes',<FaRoute/>],['daily','Today\'s Bookings',<FaCalendarAlt/>]].map(([v,l,icon]) => (
          <button key={v} onClick={() => load(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${type === v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {icon} {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : (
        <div className="card">
          {type === 'monthly' && (
            <>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Monthly Revenue & Bookings</h2>
              {data.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
                <>
                  {/* Simple bar chart visualization */}
                  <div className="mb-6">
                    {data.map((d, i) => {
                      const maxRev = Math.max(...data.map(x => x.revenue))
                      const pct = maxRev ? Math.round((d.revenue / maxRev) * 100) : 0
                      return (
                        <div key={i} className="flex items-center gap-3 mb-3">
                          <span className="text-sm text-gray-500 w-16">{MONTHS[d._id.month]} {d._id.year}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                            <div className="bg-blue-500 h-6 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-24 text-right">₹{d.revenue?.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 w-16">{d.count} bookings</span>
                        </div>
                      )
                    })}
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-gray-600"><th className="p-3 text-left">Month</th><th className="p-3 text-right">Bookings</th><th className="p-3 text-right">Revenue</th></tr></thead>
                    <tbody>{data.map((d,i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="p-3">{MONTHS[d._id.month]} {d._id.year}</td>
                        <td className="p-3 text-right font-semibold">{d.count}</td>
                        <td className="p-3 text-right font-bold text-green-600">₹{d.revenue?.toLocaleString()}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </>
              )}
            </>
          )}

          {type === 'routes' && (
            <>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Popular Routes</h2>
              {data.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-600"><th className="p-3 text-left">#</th><th className="p-3 text-left">Route</th><th className="p-3 text-right">Bookings</th><th className="p-3 text-right">Revenue</th></tr></thead>
                  <tbody>{data.map((d,i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-3 text-gray-400">{i+1}</td>
                      <td className="p-3 font-medium">{d._id.from} → {d._id.to}</td>
                      <td className="p-3 text-right font-semibold">{d.count}</td>
                      <td className="p-3 text-right font-bold text-green-600">₹{d.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </>
          )}

          {type === 'daily' && (
            <>
              <h2 className="text-lg font-bold mb-4 text-gray-800">Today's Bookings ({new Date().toDateString()})</h2>
              {data.length === 0 ? <p className="text-gray-400 text-center py-8">No bookings today</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-600"><th className="p-3 text-left">PNR</th><th className="p-3">Passenger</th><th className="p-3">Train</th><th className="p-3">Fare</th><th className="p-3">Time</th></tr></thead>
                  <tbody>{data.map((b,i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-3 font-mono text-blue-600 text-xs">{b.pnr}</td>
                      <td className="p-3">{b.user?.name}</td>
                      <td className="p-3">{b.train?.trainName}</td>
                      <td className="p-3 font-bold text-green-600">₹{b.totalFare}</td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
