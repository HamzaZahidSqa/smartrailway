import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function PasswordInput({ className = 'input-field', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={`${className} pr-10`}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  )
}
