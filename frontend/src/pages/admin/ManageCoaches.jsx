import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa'

const TYPES = ['Economy','Sleeper','Business','Executive']
const EMPTY = { train: '', coachNumber: '', coachType: 'Economy', totalSeats: 60, farePerSeat: 500 }

export default function ManageCoaches() {
  const [trains,  setTrains]  = useState([])
  const [coaches, setCoaches] = useState([])
  const [selTrain, setSelTrain] = useState('')
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.get('/trains/all').then(r => setTrains(r.data.trains || [])).catch(() => {})
  }, [])

  const loadCoaches = (trainId) => {
    setSelTrain(trainId)
    if (!trainId) { setCoaches([]); return }
    api.get(`/coaches/train/${trainId}`).then(r => setCoaches(r.data.coaches || [])).catch(() => {})
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY, train: selTrain }); setModal(true) }
  const openEdit = (c) => { setEditing(c._id); setForm({ ...c, train: c.train }); setModal(true) }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await api.put(`/coaches/${editing}`, form); toast.success('Coach updated') }
      else         { await api.post('/coaches', form);           toast.success('Coach added with seats') }
      setModal(false); loadCoaches(selTrain)
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this coach and all its seats?')) return
    try { await api.delete(`/coaches/${id}`); toast.success('Deleted'); loadCoaches(selTrain) }
    catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const typeColor = { Economy:'bg-green-100 text-green-700', Sleeper:'bg-blue-100 text-blue-700', Business:'bg-purple-100 text-purple-700', Executive:'bg-yellow-100 text-yellow-700' }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Coaches</h1>
          <Link to="/admin/trains" className="text-sm text-blue-600 hover:underline">← Manage Trains</Link>
        </div>
        <button onClick={openAdd} disabled={!selTrain} className="btn-primary flex items-center gap-2"><FaPlus/> Add Coach</button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Train</label>
        <select className="input-field max-w-sm" value={selTrain} onChange={e => loadCoaches(e.target.value)}>
          <option value="">-- Select a train --</option>
          {trains.map(t => <option key={t._id} value={t._id}>{t.trainName} ({t.trainNumber})</option>)}
        </select>
      </div>

      {selTrain && (
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-600 text-left">
              <th className="p-3">Coach #</th><th className="p-3">Type</th><th className="p-3">Total Seats</th>
              <th className="p-3">Available</th><th className="p-3">Booked</th><th className="p-3">Fare/Seat</th><th className="p-3">Actions</th>
            </tr></thead>
            <tbody>
              {coaches.map(c => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-semibold">{c.coachNumber}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColor[c.coachType]}`}>{c.coachType}</span></td>
                  <td className="p-3 text-center">{c.totalSeats}</td>
                  <td className="p-3 text-center text-green-600 font-semibold">{c.availableSeats}</td>
                  <td className="p-3 text-center text-red-600">{c.bookedSeats}</td>
                  <td className="p-3 font-semibold text-blue-700">₹{c.farePerSeat}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700"><FaEdit/></button>
                      <button onClick={() => del(c._id)}  className="text-red-500 hover:text-red-700"><FaTrash/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coaches.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No coaches for this train.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Coach' : 'Add Coach'}</h2>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Train</label>
                  <select className="input-field" value={form.train} onChange={e => set('train', e.target.value)} required>
                    <option value="">Select Train</option>
                    {trains.map(t => <option key={t._id} value={t._id}>{t.trainName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Coach Number</label>
                    <input className="input-field" value={form.coachNumber} onChange={e => set('coachNumber', e.target.value)} required placeholder="e.g. E1"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Coach Type</label>
                    <select className="input-field" value={form.coachType} onChange={e => set('coachType', e.target.value)}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Seats</label>
                    <input type="number" className="input-field" value={form.totalSeats} onChange={e => set('totalSeats', Number(e.target.value))} required min={1}/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fare per Seat (₹)</label>
                    <input type="number" className="input-field" value={form.farePerSeat} onChange={e => set('farePerSeat', Number(e.target.value))} required min={0}/>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editing ? 'Update' : 'Add Coach'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
