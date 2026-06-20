import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import SeatMap from '../components/SeatMap'
import toast from 'react-hot-toast'
import { FaTrain, FaChair, FaUser, FaCheckCircle, FaMobileAlt, FaUniversity } from 'react-icons/fa'

const STEPS = ['Select Class', 'Select Seats', 'Passenger Details', 'Payment', 'Confirm & Book']

const PAYMENT_METHODS = [
  {
    id: 'JazzCash',
    label: 'JazzCash',
    icon: '📱',
    theme: { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-700', sub: 'text-red-600', active: 'border-red-500 bg-red-50' },
    backendMethod: 'JazzCash',
  },
  {
    id: 'EasyPaisa',
    label: 'EasyPaisa',
    icon: '💚',
    theme: { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-700', sub: 'text-green-600', active: 'border-green-500 bg-green-50' },
    backendMethod: 'EasyPaisa',
  },
  {
    id: 'Meezan',
    label: 'Meezan Bank',
    icon: '🕌',
    theme: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', sub: 'text-emerald-600', active: 'border-emerald-500 bg-emerald-50' },
    backendMethod: 'BankTransfer',
    bankName: 'Meezan Bank',
    account: { title: 'Pakistan Railways', number: '02890106782443', iban: 'PK40 MEZN 0002 8901 0678 2443', branch: 'Main Branch, Lahore' },
  },
  {
    id: 'BankOfPunjab',
    label: 'Bank of Punjab',
    icon: '🏛️',
    theme: { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-700', sub: 'text-blue-600', active: 'border-blue-500 bg-blue-50' },
    backendMethod: 'BankTransfer',
    bankName: 'Bank of Punjab',
    account: { title: 'Pakistan Railways', number: '6010234567890', iban: 'PK36 BPUN 6010 2345 6789 0000', branch: 'Main Branch, Lahore' },
  },
  {
    id: 'UBL',
    label: 'United Bank Ltd',
    icon: '🏦',
    theme: { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-700', sub: 'text-purple-600', active: 'border-purple-500 bg-purple-50' },
    backendMethod: 'BankTransfer',
    bankName: 'UBL (United Bank)',
    account: { title: 'Pakistan Railways', number: '1234567890123', iban: 'PK24 UNIL 0109 0001 2345 6789', branch: 'Main Branch, Karachi' },
  },
]

export default function BookingFlow() {
  const { trainId } = useParams()
  const { state }   = useLocation()
  const navigate    = useNavigate()
  const { train, searchParams } = state || {}

  const passengers = Number(searchParams?.passengers) || 1
  const date = searchParams?.date || new Date().toISOString().split('T')[0]

  const [step, setStep]             = useState(0)
  const [coach, setCoach]           = useState(null)
  const [seats, setSeats]           = useState([])
  const [paxDetails, setPaxDetails] = useState(
    Array.from({ length: passengers }, () => ({ name: '', age: '', gender: 'Male', idType: 'CNIC', idNumber: '' }))
  )
  const [paymentMethod, setPaymentMethod] = useState('JazzCash')
  const [paymentDetails, setPaymentDetails] = useState({ phone: '', accountTitle: '', accountNumber: '', bankName: '', iban: '' })
  const [loading, setLoading] = useState(false)

  if (!train) return <div className="text-center py-20 text-red-500">Invalid booking. <a href="/" className="text-blue-600 underline">Go home</a></div>

  const coachBadge = { Economy: 'bg-green-100 text-green-700', Sleeper: 'bg-blue-100 text-blue-700', Business: 'bg-purple-100 text-purple-700', Executive: 'bg-yellow-100 text-yellow-700' }
  const totalFare  = coach ? coach.farePerSeat * passengers : 0
  const selectedM  = PAYMENT_METHODS.find(m => m.id === paymentMethod)

  const next = () => setStep(s => s + 1)
  const prev = () => setStep(s => s - 1)

  const updatePax     = (i, k, v) => setPaxDetails(prev => prev.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const updatePayment = (k, v)    => setPaymentDetails(prev => ({ ...prev, [k]: v }))

  const selectMethod = (id) => {
    setPaymentMethod(id)
    setPaymentDetails({ phone: '', accountTitle: '', accountNumber: '', bankName: '', iban: '' })
  }

  const isMobileMethod = () => selectedM?.id === 'JazzCash' || selectedM?.id === 'EasyPaisa'
  const isBankMethod   = () => ['Meezan', 'BankOfPunjab', 'UBL'].includes(selectedM?.id)

  const isPaymentValid = () => {
    if (isMobileMethod()) return paymentDetails.phone.trim().length >= 10
    if (isBankMethod())   return paymentDetails.accountTitle.trim() && paymentDetails.accountNumber.trim()
    return false
  }

  const confirm = async () => {
    setLoading(true)
    try {
      const paxWithSeats = paxDetails.map((p, i) => ({ ...p, seatNumber: seats[i]?.seatNumber || '' }))
      const { data } = await api.post('/bookings', {
        trainId, coachId: coach._id, travelDate: date,
        fromCity: searchParams.from, toCity: searchParams.to,
        passengers: paxWithSeats, seats: seats.map(s => s.seatNumber),
        totalFare,
        paymentMethod: selectedM?.backendMethod,
        paymentDetails: { ...paymentDetails, bankName: selectedM?.bankName || paymentDetails.bankName },
      })
      toast.success('Booking confirmed!')
      navigate(`/booking/${data.booking._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i <= step ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-300'}`}>{i + 1}</div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Train summary */}
      <div className="card mb-6 bg-blue-50">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <FaTrain /> {train.trainName} ({train.trainNumber}) &nbsp;|&nbsp;
          {searchParams?.from} → {searchParams?.to} &nbsp;|&nbsp;
          {new Date(date).toDateString()} &nbsp;|&nbsp; {passengers} Pax
        </div>
      </div>

      {/* Step 0: Select Class */}
      {step === 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Select Coach Class</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {train.coaches?.filter(c => c.availableSeats >= passengers).map(c => (
              <button key={c._id} onClick={() => { setCoach(c); next() }}
                className={`border-2 rounded-xl p-4 text-left transition hover:border-blue-500 hover:bg-blue-50 ${coach?._id === c._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm px-2 py-0.5 rounded font-semibold ${coachBadge[c.coachType]}`}>{c.coachType}</span>
                  <span className="font-bold text-blue-700 text-lg">Rs. {c.farePerSeat}/seat</span>
                </div>
                <p className="text-sm text-gray-500">Coach: {c.coachNumber}</p>
                <p className="text-sm text-gray-500"><FaChair className="inline text-green-500" /> {c.availableSeats} seats available</p>
                <p className="font-semibold text-gray-700 mt-1">Total: Rs. {c.farePerSeat * passengers}</p>
              </button>
            ))}
          </div>
          {!train.coaches?.some(c => c.availableSeats >= passengers) && (
            <p className="text-red-500 text-center py-4">No coaches with enough seats for {passengers} passengers.</p>
          )}
        </div>
      )}

      {/* Step 1: Select Seats */}
      {step === 1 && coach && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Select {passengers} Seat(s) — {coach.coachType} ({coach.coachNumber})</h2>
          <SeatMap coachId={coach._id} travelDate={date} maxSelect={passengers} onSeatsChange={setSeats} />
          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={seats.length !== passengers} className="btn-primary flex-1">
              Continue ({seats.length}/{passengers} selected)
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Passenger Details */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Passenger Details</h2>
          {paxDetails.map((p, i) => (
            <div key={i} className="mb-6 p-4 border border-gray-200 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-500" /> Passenger {i + 1} — Seat: <span className="text-blue-600">{seats[i]?.seatNumber}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                  <input className="input-field" value={p.name} onChange={e => updatePax(i, 'name', e.target.value)} placeholder="Full name as per CNIC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Age *</label>
                  <input type="number" className="input-field" value={p.age} onChange={e => updatePax(i, 'age', e.target.value)} min={1} max={120} placeholder="Age" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gender *</label>
                  <select className="input-field" value={p.gender} onChange={e => updatePax(i, 'gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID Type</label>
                  <select className="input-field" value={p.idType} onChange={e => updatePax(i, 'idType', e.target.value)}>
                    <option>CNIC</option><option>Passport</option><option>Driving License</option><option>B-Form</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID Number</label>
                  <input className="input-field" value={p.idNumber} onChange={e => updatePax(i, 'idNumber', e.target.value)} placeholder={p.idType === 'CNIC' ? '12345-1234567-1' : 'ID number'} />
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={paxDetails.some(p => !p.name || !p.age)} className="btn-primary flex-1">Continue to Payment</button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-1">Choose Payment Method</h2>
          <p className="text-gray-500 text-sm mb-5">Amount to pay: <span className="font-bold text-blue-700 text-lg">Rs. {totalFare}</span></p>

          {/* Method cards — 5 options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => selectMethod(m.id)}
                className={`border-2 rounded-xl p-3 text-center transition ${paymentMethod === m.id ? m.theme.active : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="font-semibold text-xs leading-tight">{m.label}</div>
              </button>
            ))}
          </div>

          {/* ─── JazzCash ─── */}
          {paymentMethod === 'JazzCash' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📱</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>JazzCash</h3>
                  <p className={`text-xs ${selectedM.theme.sub}`}>Pay via JazzCash mobile wallet</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4 text-sm border border-red-100">
                <p className="font-semibold text-gray-700 mb-2">Send payment to:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Number:</span> <strong className="text-red-700">0300-1234567</strong></p>
                  <p><span className="text-gray-500">Account Title:</span> <strong>Pakistan Railways</strong></p>
                  <p><span className="text-gray-500">Amount:</span> <strong className="text-red-700">Rs. {totalFare}</strong></p>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-500 mt-3 space-y-1">
                  <li>Open JazzCash app or dial <strong>*786#</strong></li>
                  <li>Send Money → enter <strong>0300-1234567</strong></li>
                  <li>Amount: <strong>Rs. {totalFare}</strong> → confirm PIN</li>
                  <li>Enter your JazzCash number below</li>
                </ol>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your JazzCash Number *</label>
              <input className="input-field" value={paymentDetails.phone} onChange={e => updatePayment('phone', e.target.value)} placeholder="03XX-XXXXXXX" maxLength={13} />
            </div>
          )}

          {/* ─── EasyPaisa ─── */}
          {paymentMethod === 'EasyPaisa' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💚</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>EasyPaisa</h3>
                  <p className={`text-xs ${selectedM.theme.sub}`}>Pay via EasyPaisa mobile wallet</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4 text-sm border border-green-100">
                <p className="font-semibold text-gray-700 mb-2">Send payment to:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Number:</span> <strong className="text-green-700">0345-7654321</strong></p>
                  <p><span className="text-gray-500">Account Title:</span> <strong>Pakistan Railways</strong></p>
                  <p><span className="text-gray-500">Amount:</span> <strong className="text-green-700">Rs. {totalFare}</strong></p>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-500 mt-3 space-y-1">
                  <li>Open EasyPaisa app or dial <strong>*786#</strong> (Telenor)</li>
                  <li>Send Money → enter <strong>0345-7654321</strong></li>
                  <li>Amount: <strong>Rs. {totalFare}</strong> → confirm PIN</li>
                  <li>Enter your EasyPaisa number below</li>
                </ol>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your EasyPaisa Number *</label>
              <input className="input-field" value={paymentDetails.phone} onChange={e => updatePayment('phone', e.target.value)} placeholder="03XX-XXXXXXX" maxLength={13} />
            </div>
          )}

          {/* ─── Meezan Bank ─── */}
          {paymentMethod === 'Meezan' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🕌</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>Meezan Bank</h3>
                  <p className={`text-xs ${selectedM.theme.sub}`}>Islamic Banking — Online Transfer / RAAST</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-100">
                <p className="font-semibold text-gray-700 mb-2 text-sm">Transfer to this account:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500 text-xs">Account Title</span><p className="font-semibold">{selectedM.account.title}</p></div>
                  <div><span className="text-gray-500 text-xs">Account Number</span><p className="font-mono font-semibold">{selectedM.account.number}</p></div>
                  <div><span className="text-gray-500 text-xs">IBAN</span><p className="font-mono text-xs">{selectedM.account.iban}</p></div>
                  <div><span className="text-gray-500 text-xs">Branch</span><p className="text-sm">{selectedM.account.branch}</p></div>
                  <div className="sm:col-span-2"><span className="text-gray-500 text-xs">Amount</span><p className={`font-bold text-lg ${selectedM.theme.title}`}>Rs. {totalFare}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Title *</label>
                  <input className="input-field" value={paymentDetails.accountTitle} onChange={e => updatePayment('accountTitle', e.target.value)} placeholder="Account holder name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Number *</label>
                  <input className="input-field" value={paymentDetails.accountNumber} onChange={e => updatePayment('accountNumber', e.target.value)} placeholder="Meezan account number" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your IBAN (optional)</label>
                  <input className="input-field" value={paymentDetails.iban} onChange={e => updatePayment('iban', e.target.value)} placeholder="PK00 MEZN 0000 0000 0000 0000" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Bank of Punjab ─── */}
          {paymentMethod === 'BankOfPunjab' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🏛️</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>Bank of Punjab</h3>
                  <p className={`text-xs ${selectedM.theme.sub}`}>Online Transfer / IBFT / RAAST</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                <p className="font-semibold text-gray-700 mb-2 text-sm">Transfer to this account:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500 text-xs">Account Title</span><p className="font-semibold">{selectedM.account.title}</p></div>
                  <div><span className="text-gray-500 text-xs">Account Number</span><p className="font-mono font-semibold">{selectedM.account.number}</p></div>
                  <div><span className="text-gray-500 text-xs">IBAN</span><p className="font-mono text-xs">{selectedM.account.iban}</p></div>
                  <div><span className="text-gray-500 text-xs">Branch</span><p className="text-sm">{selectedM.account.branch}</p></div>
                  <div className="sm:col-span-2"><span className="text-gray-500 text-xs">Amount</span><p className={`font-bold text-lg ${selectedM.theme.title}`}>Rs. {totalFare}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Title *</label>
                  <input className="input-field" value={paymentDetails.accountTitle} onChange={e => updatePayment('accountTitle', e.target.value)} placeholder="Account holder name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Number *</label>
                  <input className="input-field" value={paymentDetails.accountNumber} onChange={e => updatePayment('accountNumber', e.target.value)} placeholder="BOP account number" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your IBAN (optional)</label>
                  <input className="input-field" value={paymentDetails.iban} onChange={e => updatePayment('iban', e.target.value)} placeholder="PK00 BPUN 0000 0000 0000 0000" />
                </div>
              </div>
            </div>
          )}

          {/* ─── UBL ─── */}
          {paymentMethod === 'UBL' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🏦</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>United Bank Limited</h3>
                  <p className={`text-xs ${selectedM.theme.sub}`}>Online Transfer / IBFT / RAAST</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4 border border-purple-100">
                <p className="font-semibold text-gray-700 mb-2 text-sm">Transfer to this account:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500 text-xs">Account Title</span><p className="font-semibold">{selectedM.account.title}</p></div>
                  <div><span className="text-gray-500 text-xs">Account Number</span><p className="font-mono font-semibold">{selectedM.account.number}</p></div>
                  <div><span className="text-gray-500 text-xs">IBAN</span><p className="font-mono text-xs">{selectedM.account.iban}</p></div>
                  <div><span className="text-gray-500 text-xs">Branch</span><p className="text-sm">{selectedM.account.branch}</p></div>
                  <div className="sm:col-span-2"><span className="text-gray-500 text-xs">Amount</span><p className={`font-bold text-lg ${selectedM.theme.title}`}>Rs. {totalFare}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Title *</label>
                  <input className="input-field" value={paymentDetails.accountTitle} onChange={e => updatePayment('accountTitle', e.target.value)} placeholder="Account holder name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Number *</label>
                  <input className="input-field" value={paymentDetails.accountNumber} onChange={e => updatePayment('accountNumber', e.target.value)} placeholder="UBL account number" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your IBAN (optional)</label>
                  <input className="input-field" value={paymentDetails.iban} onChange={e => updatePayment('iban', e.target.value)} placeholder="PK00 UNIL 0000 0000 0000 0000" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={!isPaymentValid()} className="btn-primary flex-1">
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-gray-700">Journey Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Train:</span><span className="font-medium">{train.trainName}</span>
                <span className="text-gray-500">From → To:</span><span className="font-medium">{searchParams?.from} → {searchParams?.to}</span>
                <span className="text-gray-500">Date:</span><span className="font-medium">{new Date(date).toDateString()}</span>
                <span className="text-gray-500">Class:</span><span className="font-medium">{coach?.coachType} ({coach?.coachNumber})</span>
                <span className="text-gray-500">Seats:</span><span className="font-medium">{seats.map(s => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-gray-700">Passengers</h3>
              {paxDetails.map((p, i) => (
                <div key={i} className="text-sm flex gap-4 py-1 border-b border-gray-200 last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500">{p.age} yrs, {p.gender}</span>
                  <span className="text-blue-600">{seats[i]?.seatNumber}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-gray-700">Payment Method</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedM?.icon}</span>
                <div>
                  <p className="font-semibold">{selectedM?.label}</p>
                  {isMobileMethod() && paymentDetails.phone && <p className="text-sm text-gray-500">{paymentDetails.phone}</p>}
                  {isBankMethod() && paymentDetails.accountTitle && (
                    <p className="text-sm text-gray-500">{paymentDetails.accountTitle} — {selectedM?.bankName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Fare</span>
              <span className="text-2xl font-bold text-blue-700">Rs. {totalFare}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={confirm} disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              <FaCheckCircle /> {loading ? 'Confirming...' : `Confirm & Pay Rs. ${totalFare}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
