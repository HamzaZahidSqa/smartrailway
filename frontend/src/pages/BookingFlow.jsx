import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import SeatMap from '../components/SeatMap'
import toast from 'react-hot-toast'
import { FaTrain, FaChair, FaUser, FaCheckCircle, FaSpinner, FaLock, FaMobileAlt } from 'react-icons/fa'

const STEPS = ['Select Class', 'Select Seats', 'Passenger Details', 'Payment', 'Confirm & Pay']

const PAYMENT_METHODS = [
  {
    id: 'JazzCash',
    label: 'JazzCash',
    icon: '📱',
    type: 'mobile',
    backendMethod: 'JazzCash',
    theme: { bg: 'bg-red-50', border: 'border-red-200', activeBorder: 'border-red-500', title: 'text-red-700', badge: 'bg-red-600' },
    toNumber: '0300-1234567',
    toName: 'Pakistan Railways',
    ussd: '*786#',
  },
  {
    id: 'EasyPaisa',
    label: 'EasyPaisa',
    icon: '💚',
    type: 'mobile',
    backendMethod: 'EasyPaisa',
    theme: { bg: 'bg-green-50', border: 'border-green-200', activeBorder: 'border-green-500', title: 'text-green-700', badge: 'bg-green-600' },
    toNumber: '0345-7654321',
    toName: 'Pakistan Railways',
    ussd: '*786# (Telenor)',
  },
  {
    id: 'Meezan',
    label: 'Meezan Bank',
    icon: '🕌',
    type: 'bank',
    backendMethod: 'BankTransfer',
    bankName: 'Meezan Bank',
    theme: { bg: 'bg-emerald-50', border: 'border-emerald-200', activeBorder: 'border-emerald-500', title: 'text-emerald-700', badge: 'bg-emerald-700' },
    account: { title: 'Pakistan Railways', number: '02890106782443', iban: 'PK40 MEZN 0002 8901 0678 2443', branch: 'Main Branch, Lahore' },
  },
  {
    id: 'BankOfPunjab',
    label: 'Bank of Punjab',
    icon: '🏛️',
    type: 'bank',
    backendMethod: 'BankTransfer',
    bankName: 'Bank of Punjab',
    theme: { bg: 'bg-blue-50', border: 'border-blue-200', activeBorder: 'border-blue-500', title: 'text-blue-700', badge: 'bg-blue-700' },
    account: { title: 'Pakistan Railways', number: '6010234567890', iban: 'PK36 BPUN 6010 2345 6789 0000', branch: 'Main Branch, Lahore' },
  },
  {
    id: 'UBL',
    label: 'United Bank Ltd',
    icon: '🏦',
    type: 'bank',
    backendMethod: 'BankTransfer',
    bankName: 'UBL (United Bank)',
    theme: { bg: 'bg-purple-50', border: 'border-purple-200', activeBorder: 'border-purple-500', title: 'text-purple-700', badge: 'bg-purple-700' },
    account: { title: 'Pakistan Railways', number: '1234567890123', iban: 'PK24 UNIL 0109 0001 2345 6789', branch: 'Main Branch, Karachi' },
  },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* ─── Payment Processing Overlay ─── */
function PaymentOverlay({ method, amount, stage, done, failed }) {
  const stages = [
    { label: `Connecting to ${method?.label}...`, icon: '🔗' },
    { label: 'Verifying payment details...', icon: '🔍' },
    { label: `Processing Rs. ${amount}...`, icon: '⚙️' },
    { label: 'Payment Successful!', icon: '✅' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-5xl mb-4">{done ? '✅' : failed ? '❌' : method?.icon}</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{failed ? 'Payment Failed' : done ? 'Payment Verified!' : 'Processing Payment'}</h2>
        <p className="text-sm text-gray-500 mb-6">{method?.label} • Rs. {amount}</p>

        {!failed && (
          <div className="space-y-3 text-left mb-6">
            {stages.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i > stage ? 'opacity-30' : 'opacity-100'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  i < stage ? 'bg-green-100 text-green-600' :
                  i === stage ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < stage ? '✓' : i === stage && !done ? <FaSpinner className="animate-spin text-xs" /> : s.icon}
                </div>
                <span className={`text-sm ${i === stage ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {done && <div className="text-green-600 font-semibold text-sm animate-pulse">Creating your booking...</div>}
        {failed && <p className="text-red-500 text-sm">Please check your details and try again.</p>}
        <div className={`h-1 rounded-full mt-4 transition-all duration-1000 ${failed ? 'bg-red-200' : 'bg-blue-100'}`}>
          <div className={`h-1 rounded-full transition-all duration-700 ${failed ? 'bg-red-500 w-full' : done ? 'bg-green-500 w-full' : 'bg-blue-500'}`}
            style={{ width: done ? '100%' : `${(stage / 3) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function BookingFlow() {
  const { trainId } = useParams()
  const { state }   = useLocation()
  const navigate    = useNavigate()
  const { train, searchParams } = state || {}

  const initPax = Number(searchParams?.passengers) || 1
  const date = searchParams?.date || new Date().toISOString().split('T')[0]

  const [step, setStep]         = useState(0)
  const [coach, setCoach]       = useState(null)
  const [seats, setSeats]       = useState([])
  const [passengers, setPassengers] = useState(initPax)
  const [paxDetails, setPaxDetails] = useState(
    Array.from({ length: initPax }, () => ({ name: '', age: '', gender: 'Male', idType: 'CNIC', idNumber: '' }))
  )

  const changePassengers = (n) => {
    const clamped = Math.max(1, Math.min(6, n))
    setPassengers(clamped)
    setSeats([])
    setPaxDetails(prev => {
      if (clamped > prev.length)
        return [...prev, ...Array.from({ length: clamped - prev.length }, () => ({ name: '', age: '', gender: 'Male', idType: 'CNIC', idNumber: '' }))]
      return prev.slice(0, clamped)
    })
  }
  const [paymentId, setPaymentId]   = useState('JazzCash')
  const [paymentDetails, setPaymentDetails] = useState({ phone: '', accountTitle: '', accountNumber: '', iban: '' })

  const [processing,   setProcessing]   = useState(false)
  const [procStage,    setProcStage]    = useState(0)
  const [procDone,     setProcDone]     = useState(false)
  const [procFailed,   setProcFailed]   = useState(false)

  if (!train) return <div className="text-center py-20 text-red-500">Invalid booking. <a href="/" className="text-blue-600 underline">Go home</a></div>

  const selectedM  = PAYMENT_METHODS.find(m => m.id === paymentId)
  const totalFare  = coach ? coach.farePerSeat * passengers : 0
  const coachBadge = { Economy: 'bg-green-100 text-green-700', Sleeper: 'bg-blue-100 text-blue-700', Business: 'bg-purple-100 text-purple-700', Executive: 'bg-yellow-100 text-yellow-700' }

  const next = () => setStep(s => s + 1)
  const prev = () => setStep(s => s - 1)
  const updatePax     = (i, k, v) => setPaxDetails(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const updatePayment = (k, v)    => setPaymentDetails(p => ({ ...p, [k]: v }))
  const selectMethod  = (id) => { setPaymentId(id); setPaymentDetails({ phone: '', accountTitle: '', accountNumber: '', iban: '' }) }

  const isPaymentValid = () => {
    if (selectedM?.type === 'mobile') return paymentDetails.phone.replace(/\D/g, '').length === 11
    if (selectedM?.type === 'bank')   return paymentDetails.accountTitle.trim().length > 0 && paymentDetails.accountNumber.replace(/\D/g, '').length > 0
    return false
  }

  /* ─ Process payment then create booking ─ */
  const runPaymentAndBook = async () => {
    setProcessing(true); setProcStage(0); setProcDone(false); setProcFailed(false)
    try {
      await sleep(900);  setProcStage(1)
      await sleep(1100); setProcStage(2)
      await sleep(1300); setProcStage(3); setProcDone(true)
      await sleep(700)

      const paxWithSeats = paxDetails.map((p, i) => ({ ...p, seatNumber: seats[i]?.seatNumber || '' }))
      const { data } = await api.post('/bookings', {
        trainId, coachId: coach._id, travelDate: date,
        fromCity: searchParams.from, toCity: searchParams.to,
        passengers: paxWithSeats, seats: seats.map(s => s.seatNumber),
        totalFare,
        paymentMethod: selectedM?.backendMethod,
        paymentDetails: { ...paymentDetails, bankName: selectedM?.bankName || '' },
      })
      toast.success('Booking confirmed!')
      navigate(`/booking/${data.booking._id}`)
    } catch (err) {
      setProcDone(false); setProcFailed(true)
      await sleep(2000)
      setProcessing(false); setProcFailed(false)
      toast.error(err.response?.data?.message || 'Payment failed. Try again.')
    }
  }

  /* ─ Confirm button clicked ─ */
  const handleConfirm = () => runPaymentAndBook()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Payment processing overlay */}
      {processing && <PaymentOverlay method={selectedM} amount={totalFare} stage={procStage} done={procDone} failed={procFailed} />}

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

      {/* Train summary bar */}
      <div className="card mb-6 bg-blue-50">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm flex-wrap">
          <FaTrain /> {train.trainName} ({train.trainNumber})
          <span className="text-gray-400">|</span> {searchParams?.from} → {searchParams?.to}
          <span className="text-gray-400">|</span> {new Date(date).toDateString()}
          <span className="text-gray-400">|</span> {passengers} Pax
          {coach && <><span className="text-gray-400">|</span> <span className="font-bold text-blue-700">Rs. {totalFare}</span></>}
        </div>
      </div>

      {/* ═══ Step 0: Select Class ═══ */}
      {step === 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Select Coach Class</h2>

          {/* Passenger count stepper */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-sm font-semibold text-blue-800">Passengers:</span>
            <div className="flex items-center gap-3">
              <button onClick={() => changePassengers(passengers - 1)} disabled={passengers <= 1}
                className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center text-blue-700 hover:bg-blue-100 disabled:opacity-30 font-bold text-lg">−</button>
              <span className="text-2xl font-bold text-blue-700 w-8 text-center">{passengers}</span>
              <button onClick={() => changePassengers(passengers + 1)} disabled={passengers >= 6}
                className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center text-blue-700 hover:bg-blue-100 disabled:opacity-30 font-bold text-lg">+</button>
            </div>
            <span className="text-xs text-blue-500 ml-1">(max 6)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {train.coaches?.filter(c => c.availableSeats >= passengers).map(c => (
              <button key={c._id} onClick={() => { setCoach(c); next() }}
                className="border-2 border-gray-200 rounded-xl p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition">
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

      {/* ═══ Step 1: Seats ═══ */}
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

      {/* ═══ Step 2: Passenger Details ═══ */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Passenger Details</h2>
          {paxDetails.map((p, i) => (
            <div key={i} className="mb-6 p-4 border border-gray-200 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-500" /> Passenger {i + 1}
                <span className="text-blue-600 font-mono text-sm">— {seats[i]?.seatNumber}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                  <input className="input-field" value={p.name} onChange={e => updatePax(i, 'name', e.target.value)} placeholder="As per CNIC" />
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    ID Number {p.idType === 'CNIC' && <span className="text-xs text-gray-400">(13 digits)</span>}
                  </label>
                  <input
                    className="input-field"
                    value={p.idNumber}
                    inputMode={p.idType === 'CNIC' ? 'numeric' : 'text'}
                    maxLength={p.idType === 'CNIC' ? 13 : 50}
                    onChange={e => {
                      const val = p.idType === 'CNIC'
                        ? e.target.value.replace(/\D/g, '').slice(0, 13)
                        : e.target.value
                      updatePax(i, 'idNumber', val)
                    }}
                    placeholder={p.idType === 'CNIC' ? '3420XXXXXXXXX (13 digits)' : 'ID number'}
                  />
                  {p.idType === 'CNIC' && p.idNumber.length > 0 && p.idNumber.length < 13 && (
                    <p className="text-xs text-orange-500 mt-1">{13 - p.idNumber.length} more digit(s) required</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={paxDetails.some(p => !p.name || !p.age)} className="btn-primary flex-1">
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 3: Payment ═══ */}
      {step === 3 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-1">Choose Payment Method</h2>
          <p className="text-gray-500 text-sm mb-5 flex items-center gap-1">
            <FaLock className="text-green-500" /> Secure Payment — Amount: <strong className="text-blue-700 text-base ml-1">Rs. {totalFare}</strong>
          </p>

          {/* Method cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => selectMethod(m.id)}
                className={`border-2 rounded-xl p-3 text-center transition-all ${paymentId === m.id
                  ? `${m.theme.activeBorder} ${m.theme.bg} shadow-md scale-105`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className={`font-semibold text-xs leading-tight ${paymentId === m.id ? m.theme.title : 'text-gray-700'}`}>{m.label}</div>
                {paymentId === m.id && <div className={`mt-1.5 w-2 h-2 rounded-full ${m.theme.badge} mx-auto`} />}
              </button>
            ))}
          </div>

          {/* ── Mobile wallets (JazzCash / EasyPaisa) ── */}
          {selectedM?.type === 'mobile' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{selectedM.icon}</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>{selectedM.label}</h3>
                  <p className="text-xs text-gray-500">Mobile Wallet Payment</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transfer Details</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Send To:</span>
                  <strong className={selectedM.theme.title}>{selectedM.toNumber}</strong>
                  <span className="text-gray-500">Account Title:</span>
                  <span className="font-medium">{selectedM.toName}</span>
                  <span className="text-gray-500">Amount:</span>
                  <strong className={selectedM.theme.title}>Rs. {totalFare}</strong>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Steps:</p>
                  <ol className="text-xs text-gray-500 space-y-0.5 list-decimal list-inside">
                    <li>Dial <strong>{selectedM.ussd}</strong> or open {selectedM.label} app</li>
                    <li>Send Money → <strong>{selectedM.toNumber}</strong></li>
                    <li>Amount: <strong>Rs. {totalFare}</strong> → confirm PIN</li>
                    <li>Enter your number below — OTP will be sent</li>
                  </ol>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <FaMobileAlt className="inline mr-1" /> Your {selectedM.label} Number * <span className="text-xs font-normal text-gray-400">(11 digits)</span>
              </label>
              <input
                className="input-field text-lg tracking-wider"
                value={paymentDetails.phone}
                inputMode="numeric"
                maxLength={11}
                onChange={e => updatePayment('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="03XXXXXXXXX"
              />
              {paymentDetails.phone.length > 0 && paymentDetails.phone.length < 11 && (
                <p className="text-xs text-orange-500 mt-1">{11 - paymentDetails.phone.length} more digit(s) required</p>
              )}
              <p className="text-xs text-gray-400 mt-1">An OTP will be sent to verify your payment.</p>
            </div>
          )}

          {/* ── Bank Transfer ── */}
          {selectedM?.type === 'bank' && (
            <div className={`${selectedM.theme.bg} border ${selectedM.theme.border} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{selectedM.icon}</span>
                <div>
                  <h3 className={`font-bold text-lg ${selectedM.theme.title}`}>{selectedM.label}</h3>
                  <p className="text-xs text-gray-500">Online Transfer / IBFT / RAAST</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bank Account Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div><p className="text-xs text-gray-400">Account Title</p><p className="font-semibold">{selectedM.account.title}</p></div>
                  <div><p className="text-xs text-gray-400">Account Number</p><p className="font-mono font-semibold">{selectedM.account.number}</p></div>
                  <div><p className="text-xs text-gray-400">IBAN</p><p className="font-mono text-xs">{selectedM.account.iban}</p></div>
                  <div><p className="text-xs text-gray-400">Branch</p><p className="text-sm">{selectedM.account.branch}</p></div>
                </div>
                <div className={`mt-3 pt-3 border-t border-gray-100 flex justify-between items-center`}>
                  <span className="text-sm text-gray-500">Transfer Amount:</span>
                  <strong className={`text-xl ${selectedM.theme.title}`}>Rs. {totalFare}</strong>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Account Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Title *</label>
                  <input className="input-field" value={paymentDetails.accountTitle}
                    onChange={e => updatePayment('accountTitle', e.target.value)} placeholder="Your account holder name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input
                    className="input-field"
                    value={paymentDetails.accountNumber}
                    inputMode="numeric"
                    onChange={e => updatePayment('accountNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="Digits only"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your IBAN (optional)</label>
                  <input className="input-field" value={paymentDetails.iban}
                    onChange={e => updatePayment('iban', e.target.value)} placeholder="PK00 XXXX 0000 0000 0000 0000" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={!isPaymentValid()} className="btn-primary flex-1">
              Review & Confirm
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 4: Confirm ═══ */}
      {step === 4 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Review & Confirm Booking</h2>
          <div className="space-y-4">

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-gray-700 text-sm uppercase tracking-wide">Journey</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Train</span><span className="font-medium">{train.trainName} ({train.trainNumber})</span>
                <span className="text-gray-500">Route</span><span className="font-medium">{searchParams?.from} → {searchParams?.to}</span>
                <span className="text-gray-500">Date</span><span className="font-medium">{new Date(date).toDateString()}</span>
                <span className="text-gray-500">Class</span><span className="font-medium">{coach?.coachType} ({coach?.coachNumber})</span>
                <span className="text-gray-500">Seats</span><span className="font-medium font-mono">{seats.map(s => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-gray-700 text-sm uppercase tracking-wide">Passengers</h3>
              {paxDetails.map((p, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-200 last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500">{p.age}y, {p.gender}</span>
                  <span className="text-blue-600 font-mono">{seats[i]?.seatNumber}</span>
                </div>
              ))}
            </div>

            <div className={`${selectedM?.theme.bg} border ${selectedM?.theme.border} rounded-xl p-4`}>
              <h3 className="font-semibold mb-3 text-gray-700 text-sm uppercase tracking-wide">Payment</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedM?.icon}</span>
                <div>
                  <p className={`font-bold ${selectedM?.theme.title}`}>{selectedM?.label}</p>
                  {selectedM?.type === 'mobile' && <p className="text-sm text-gray-600">{paymentDetails.phone}</p>}
                  {selectedM?.type === 'bank' && <p className="text-sm text-gray-600">{paymentDetails.accountTitle} — {selectedM?.bankName}</p>}
                </div>
                <div className="ml-auto flex items-center gap-1 text-green-600 text-xs font-medium">
                  <FaLock /> Secure
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 flex justify-between items-center text-white">
              <div>
                <p className="text-blue-200 text-sm">Total Amount</p>
                <p className="text-3xl font-bold">Rs. {totalFare}</p>
              </div>
              <div className="text-right text-blue-200 text-sm">
                <p>{passengers} × Rs. {coach?.farePerSeat}</p>
                <p>{coach?.coachType} class</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={handleConfirm}
              className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-lg text-base ${selectedM?.theme.badge || 'bg-blue-600'} hover:opacity-90 active:scale-95`}>
              <FaCheckCircle />
              {selectedM?.type === 'mobile' ? `Pay Rs. ${totalFare} via ${selectedM?.label}` : `Confirm & Pay Rs. ${totalFare}`}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
            <FaLock /> Your payment is secured and encrypted
          </p>
        </div>
      )}
    </div>
  )
}
