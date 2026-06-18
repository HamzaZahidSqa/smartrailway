import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FaTrain } from 'react-icons/fa'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [resetToken, setResetToken] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setResetToken(data.resetToken || '')
      setSent(true)
      toast.success('Reset token generated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <FaTrain className="text-blue-600 text-4xl mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
        {sent ? (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-green-700 font-semibold mb-2">Password reset link generated!</p>
              <p className="text-gray-600 text-sm mb-3">
                In a production system this would be emailed to <strong>{email}</strong>.<br/>
                For demo, use the link below:
              </p>
              {resetToken && (
                <button
                  onClick={() => navigate(`/reset-password/${resetToken}`)}
                  className="btn-primary w-full text-sm py-2"
                >
                  Click to Reset Password
                </button>
              )}
            </div>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 text-left">
            <p className="text-gray-500 text-sm text-center mb-4">Enter your email and we'll generate a reset link.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Processing...' : 'Generate Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500"><Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link></p>
          </form>
        )}
      </div>
    </div>
  )
}
