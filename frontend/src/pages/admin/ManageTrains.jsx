import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FaTrain, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const EMPTY = { trainNumber:'', trainName:'', source:'', destination:'', departureTime:'', arrivalTime:'', duration:'', totalDistance:'', runningDays:[], status:'Active' }

export default function ManageTrains() {
  const [trains,  setTrains]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/trains/all').then(r => setTrains(r.data.trains || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (t) => { setEditing(t._id); setForm({ ...t }); setModal(true) }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleDay = (d) => set('runningDays', form.runningDays.includes(d) ? form.runningDays.filter(x => x !== d) : [...form.runningDays, d])

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await api.put(`/trains/${editing}`, form); toast.success('Train updated') }
      else         { await api.post('/trains', form);           toast.success('Train added') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this train?')) return
    try { await api.delete(`/trains/${id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const statusColor = { Active:'bg-green-100 text-green-700', Inactive:'bg-gray-100 text-gray-600', Delayed:'bg-yellow-100 text-yellow-700', Cancelled:'bg-red-100 text-red-700' }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Trains</h1>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/coaches" className="btn-secondary">Manage Coaches</Link>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><FaPlus/> Add Train</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left">
                <th className="p-3">Train #</th><th className="p-3">Name</th><th className="p-3">Route</th>
                <th className="p-3">Departure</th><th className="p-3">Arrival</th><th className="p-3">Days</th>
                <th className="p-3">Status</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trains.map(t => (
                <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono font-semibold text-blue-600">{t.trainNumber}</td>
                  <td className="p-3 font-medium flex items-center gap-1"><FaTrain className="text-blue-400"/>{t.trainName}</td>
                  <td className="p-3 text-gray-500">{t.source} → {t.destination}</td>
                  <td className="p-3">{t.departureTime}</td>
                  <td className="p-3">{t.arrivalTime}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{t.runningDays?.map(d => <span key={d} className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded">{d}</span>)}</div></td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[t.status]}`}>{t.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-blue-500 hover:text-blue-700"><FaEdit/></button>
                      <button onClick={() => del(t._id)}  className="text-red-500 hover:text-red-700"><FaTrash/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {trains.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No trains. Add one!</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Train' : 'Add New Train'}</h2>
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['trainNumber','Train Number','text','e.g. 12301'],
                    ['trainName','Train Name','text','e.g. Rajdhani Express'],
                    ['source','Source City','text','From city'],
                    ['destination','Destination','text','To city'],
                    ['departureTime','Departure Time','time',''],
                    ['arrivalTime','Arrival Time','time',''],
                    ['duration','Duration','text','e.g. 15h 40m'],
                    ['totalDistance','Distance (km)','number',''],
                  ].map(([k,l,t,ph]) => (
                    <div key={k}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                      <input type={t} className="input-field text-sm" placeholder={ph}
                        value={form[k]} onChange={e => set(k, e.target.value)} required={['trainNumber','trainName','source','destination','departureTime','arrivalTime'].includes(k)}/>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Running Days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(d => (
                      <button type="button" key={d} onClick={() => toggleDay(d)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${form.runningDays?.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select className="input-field text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                    {['Active','Inactive','Delayed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update Train' : 'Add Train'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
