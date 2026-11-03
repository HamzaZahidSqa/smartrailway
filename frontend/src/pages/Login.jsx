import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FaTrain } from 'react-icons/fa'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Go back to the page the user was trying to open, otherwise to the train search home page
  const from = location.state?.from || '/'

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
  }, [user, navigate])

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate(data.user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Incorrect email or password. Please try again.'
        : err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <FaTrain className="text-blue-600 text-4xl mx-auto mb-2"/>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to your SmartRail account</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" placeholder="your@email.com"
              value={form.email} onChange={e => { setError(''); setForm(p => ({ ...p, email: e.target.value })) }} required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput placeholder="••••••••"
              value={form.password} onChange={e => { setError(''); setForm(p => ({ ...p, password: e.target.value })) }} required/>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-gray-600">
          <strong>Demo:</strong> admin@railway.com / Admin@123 &nbsp;|&nbsp; john@example.com / User@123
        </div>

        <p className="text-center mt-4 text-sm text-gray-600">
          No account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  )
}
