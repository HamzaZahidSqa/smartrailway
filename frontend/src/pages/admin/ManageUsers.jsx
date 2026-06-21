import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FaUsers, FaTicketAlt, FaEnvelope, FaPhone, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa'

const ROLE_BADGE = {
  admin:     'bg-red-100 text-red-700 border border-red-200',
  passenger: 'bg-blue-100 text-blue-700 border border-blue-200',
}

export default function ManageUsers() {
  const [users,      setUsers]      = useState([])
  const [adminCount, setAdminCount] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    api.get('/admin/users')
      .then(r => { setUsers(r.data.users || []); setAdminCount(r.data.adminCount || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUsers className="text-purple-600" /> Manage Users
          </h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered user(s)</p>
        </div>
        <Link to="/admin" className="btn-secondary text-sm px-4 py-2 w-fit">← Back to Dashboard</Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          className="input-field max-w-sm"
          placeholder="Search by name, email or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users',   value: users.length,                                        color: 'purple' },
          { label: 'Passengers',    value: users.filter(u => u.role === 'passenger').length,    color: 'blue'   },
          { label: 'Admins',        value: adminCount,                                          color: 'red'    },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaUsers className="text-5xl mx-auto mb-3 text-gray-300"/>
          <p>No users found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1"><FaEnvelope className="text-gray-400 text-xs"/>{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.phone
                        ? <span className="flex items-center gap-1"><FaPhone className="text-gray-400 text-xs"/>{u.phone}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' && <FaShieldAlt className="text-xs"/>}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <FaTicketAlt className="text-xs"/>{u.totalBookings}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-300"/>
                        {new Date(u.createdAt).toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u, i) => (
              <div key={u._id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><FaPhone className="text-xs text-gray-400"/>{u.phone || '—'}</span>
                  <span className="flex items-center gap-1 text-blue-600 font-semibold"><FaTicketAlt className="text-xs"/>{u.totalBookings} booking(s)</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 col-span-2">
                    <FaCalendarAlt className="text-gray-300"/>
                    Joined {new Date(u.createdAt).toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
