import { FaTrain } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaTrain className="text-yellow-300 text-xl" />
          <span className="font-bold text-lg">Smart Railway Reservation System</span>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} SmartRail. All rights reserved.</p>
      </div>
    </footer>
  )
}
