import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FaTrain } from 'react-icons/fa'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <FaTrain className="text-blue-600 text-4xl mx-auto mb-2"/>
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 text-sm">Join SmartRail for easy ticket booking</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {[
            { k:'name',     label:'Full Name',    type:'text',     ph:'John Doe' },
            { k:'email',    label:'Email',         type:'email',    ph:'your@email.com' },
            { k:'phone',    label:'Phone Number',  type:'tel',      ph:'9876543210' },
            { k:'password', label:'Password',      type:'password', ph:'Min 6 characters' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} className="input-field" placeholder={f.ph}
                value={form[f.k]} onChange={set(f.k)} required={f.k !== 'phone'}
                minLength={f.k === 'password' ? 6 : undefined}/>
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
