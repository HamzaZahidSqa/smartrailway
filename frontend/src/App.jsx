import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SearchResults from './pages/SearchResults'
import BookingFlow from './pages/BookingFlow'
import BookingConfirmation from './pages/BookingConfirmation'
import Dashboard from './pages/Dashboard'
import TicketView from './pages/TicketView'
import PNRStatus from './pages/PNRStatus'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageTrains from './pages/admin/ManageTrains'
import ManageCoaches from './pages/admin/ManageCoaches'
import ManageUsers from './pages/admin/ManageUsers'
import AllBookings from './pages/admin/AllBookings'
import Reports from './pages/admin/Reports'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>
  return user?.role === 'admin' ? children : <Navigate to="/" />
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                    element={<Home />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/register"            element={<Register />} />
          <Route path="/forgot-password"     element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/search"              element={<SearchResults />} />
          <Route path="/pnr-status"          element={<PNRStatus />} />
          <Route path="/book/:trainId"       element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
          <Route path="/booking/:id"         element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/ticket/:bookingId"   element={<ProtectedRoute><TicketView /></ProtectedRoute>} />
          <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/trains"        element={<AdminRoute><ManageTrains /></AdminRoute>} />
          <Route path="/admin/coaches"       element={<AdminRoute><ManageCoaches /></AdminRoute>} />
          <Route path="/admin/bookings"      element={<AdminRoute><AllBookings /></AdminRoute>} />
          <Route path="/admin/users"         element={<AdminRoute><ManageUsers /></AdminRoute>} />
          <Route path="/admin/reports"       element={<AdminRoute><Reports /></AdminRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
