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
    color: 'red',
    icon: '📱',
    desc: 'Pay via JazzCash mobile account',
    accountInfo: '0300-1234567 (Demo)',
  },
  {
    id: 'EasyPaisa',
    label: 'EasyPaisa',
    color: 'green',
    icon: '💚',
    desc: 'Pay via EasyPaisa mobile account',
    accountInfo: '0345-7654321 (Demo)',
  },
  {
    id: 'BankTransfer',
    label: 'Bank Transfer',
    color: 'blue',
    icon: '🏦',
    desc: 'Transfer to official railway bank account',
    accountInfo: 'HBL / MCB / UBL / ABL / Meezan',
  },
]

const PAKISTANI_BANKS = [
  'HBL (Habib Bank)',
  'MCB Bank',
  'UBL (United Bank)',
  'ABL (Allied Bank)',
  'Meezan Bank',
  'Bank Alfalah',
  'Standard Chartered Pakistan',
  'Askari Bank',
  'Faysal Bank',
  'Bank of Punjab',
  'JS Bank',
  'Silk Bank',
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
  const [paymentDetails, setPaymentDetails] = useState({
    phone: '',
    accountTitle: '',
    accountNumber: '',
    bankName: 'HBL (Habib Bank)',
    iban: '',
  })
  const [loading, setLoading] = useState(false)

  if (!train) return <div className="text-center py-20 text-red-500">Invalid booking. <a href="/" className="text-blue-600 underline">Go home</a></div>

  const coachBadge = { Economy:'bg-green-100 text-green-700', Sleeper:'bg-blue-100 text-blue-700', Business:'bg-purple-100 text-purple-700', Executive:'bg-yellow-100 text-yellow-700' }

  const totalFare = coach ? coach.farePerSeat * passengers : 0

  const next = () => setStep(s => s + 1)
  const prev = () => setStep(s => s - 1)

  const updatePax = (i, k, v) => setPaxDetails(prev => prev.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const updatePayment = (k, v) => setPaymentDetails(prev => ({ ...prev, [k]: v }))

  const isPaymentValid = () => {
    if (paymentMethod === 'BankTransfer') {
      return paymentDetails.accountTitle.trim() && paymentDetails.accountNumber.trim()
    }
    return paymentDetails.phone.trim().length >= 10
  }

  const confirm = async () => {
    setLoading(true)
    try {
      const paxWithSeats = paxDetails.map((p, i) => ({ ...p, seatNumber: seats[i]?.seatNumber || '' }))
      const { data } = await api.post('/bookings', {
        trainId, coachId: coach._id, travelDate: date,
        fromCity: searchParams.from, toCity: searchParams.to,
        passengers: paxWithSeats, seats: seats.map(s => s.seatNumber),
        totalFare, paymentMethod, paymentDetails,
      })
      toast.success('Booking confirmed!')
      navigate(`/booking/${data.booking._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i <= step ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-300'}`}>{i + 1}</div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`}/>}
          </div>
        ))}
      </div>

      {/* Train summary */}
      <div className="card mb-6 bg-blue-50">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <FaTrain/> {train.trainName} ({train.trainNumber}) &nbsp;|&nbsp;
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
                <p className="text-sm text-gray-500"><FaChair className="inline text-green-500"/> {c.availableSeats} seats available</p>
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
          <SeatMap coachId={coach._id} travelDate={date} maxSelect={passengers} onSeatsChange={setSeats}/>
          <div className="flex gap-3 mt-6">
            <button onClick={prev} className="btn-secondary flex-1">Back</button>
            <button onClick={next} disabled={seats.length !== passengers}
              className="btn-primary flex-1" title={seats.length !== passengers ? `Select ${passengers} seat(s)` : ''}>
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
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUser className="text-blue-500"/> Passenger {i + 1} — Seat: <span className="text-blue-600">{seats[i]?.seatNumber}</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                  <input className="input-field" value={p.name} onChange={e => updatePax(i,'name',e.target.value)} required placeholder="Full name as per CNIC"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Age *</label>
                  <input type="number" className="input-field" value={p.age} onChange={e => updatePax(i,'age',e.target.value)} required min={1} max={120} placeholder="Age"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gender *</label>
                  <select className="input-field" value={p.gender} onChange={e => updatePax(i,'gender',e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID Type</label>
                  <select className="input-field" value={p.idType} onChange={e => updatePax(i,'idType',e.target.value)}>
                    <option>CNIC</option>
                    <option>Passport</option>
                    <option>Driving License</option>
                    <option>B-Form</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID Number</label>
                  <input className="input-field" value={p.idNumber} onChange={e => updatePax(i,'idNumber',e.target.value)} placeholder={p.idType === 'CNIC' ? '12345-1234567-1' : 'ID number'}/>
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
          <h2 className="text-xl font-bold mb-2">Choose Payment Method</h2>
          <p className="text-gray-500 text-sm mb-6">Amount to pay: <span className="font-bold text-blue-700 text-lg">Rs. {totalFare}</span></p>

          {/* Method selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`border-2 rounded-xl p-3 text-center transition ${paymentMethod === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-xs text-gray-500 mt-1 hidden sm:block">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* JazzCash form */}
          {paymentMethod === 'JazzCash' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-bold text-red-700">JazzCash Payment</h3>
                  <p className="text-xs text-red-600">Send payment to: <strong>{PAYMENT_METHODS[0].accountInfo}</strong></p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 mb-4 text-sm text-gray-600 border border-red-100">
                <p className="font-medium mb-1">Steps to pay via JazzCash:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open JazzCash app or dial <strong>*786#</strong></li>
                  <li>Go to "Send Money" → enter number: <strong>0300-1234567</strong></li>
                  <li>Enter amount: <strong>Rs. {totalFare}</strong></li>
                  <li>Enter your JazzCash PIN to confirm</li>
                  <li>Enter the transaction ID below</li>
                </ol>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your JazzCash Mobile Number *</label>
              <input className="input-field mb-3" value={paymentDetails.phone}
                onChange={e => updatePayment('phone', e.target.value)}
                placeholder="03XX-XXXXXXX" maxLength={13}/>
              <p className="text-xs text-gray-500">This number will be used for payment verification.</p>
            </div>
          )}

          {/* EasyPaisa form */}
          {paymentMethod === 'EasyPaisa' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💚</span>
                <div>
                  <h3 className="font-bold text-green-700">EasyPaisa Payment</h3>
                  <p className="text-xs text-green-600">Send payment to: <strong>{PAYMENT_METHODS[1].accountInfo}</strong></p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 mb-4 text-sm text-gray-600 border border-green-100">
                <p className="font-medium mb-1">Steps to pay via EasyPaisa:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open EasyPaisa app or dial <strong>*786#</strong> on Telenor</li>
                  <li>Go to "Send Money" → enter number: <strong>0345-7654321</strong></li>
                  <li>Enter amount: <strong>Rs. {totalFare}</strong></li>
                  <li>Confirm with your EasyPaisa PIN</li>
                  <li>Enter your EasyPaisa number below</li>
                </ol>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your EasyPaisa Mobile Number *</label>
              <input className="input-field mb-3" value={paymentDetails.phone}
                onChange={e => updatePayment('phone', e.target.value)}
                placeholder="03XX-XXXXXXX" maxLength={13}/>
              <p className="text-xs text-gray-500">This number will be used for payment verification.</p>
            </div>
          )}

          {/* Bank Transfer form */}
          {paymentMethod === 'BankTransfer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏦</span>
                <div>
                  <h3 className="font-bold text-blue-700">Bank Transfer</h3>
                  <p className="text-xs text-blue-600">Transfer to official Pakistan Railways account</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 mb-4 text-xs text-gray-700 border border-blue-100 space-y-1">
                <p className="font-semibold text-sm mb-2">Official Bank Account Details:</p>
                <p><span className="text-gray-500">Account Title:</span> <strong>Pakistan Railways</strong></p>
                <p><span className="text-gray-500">Account No:</span> <strong>0001-79006941-01</strong></p>
                <p><span className="text-gray-500">IBAN:</span> <strong>PK36 HABB 0001 7900 6941 0100</strong></p>
                <p><span className="text-gray-500">Bank:</span> <strong>HBL (Habib Bank Limited)</strong></p>
                <p><span className="text-gray-500">Branch:</span> <strong>Lahore Main Branch</strong></p>
                <p className="text-blue-600 font-medium mt-2">Transfer Amount: Rs. {totalFare}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Title *</label>
                  <input className="input-field" value={paymentDetails.accountTitle}
                    onChange={e => updatePayment('accountTitle', e.target.value)}
                    placeholder="Account holder name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Number *</label>
                  <input className="input-field" value={paymentDetails.accountNumber}
                    onChange={e => updatePayment('accountNumber', e.target.value)}
                    placeholder="XXXX-XXXXXXXXXX-XX"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Bank</label>
                  <select className="input-field" value={paymentDetails.bankName}
                    onChange={e => updatePayment('bankName', e.target.value)}>
                    {PAKISTANI_BANKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN (optional)</label>
                  <input className="input-field" value={paymentDetails.iban}
                    onChange={e => updatePayment('iban', e.target.value)}
                    placeholder="PK00 XXXX 0000 0000 0000 00"/>
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

            {/* Payment summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-gray-700">Payment Method</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-xl">{selectedMethod?.icon}</span>
                <div>
                  <p className="font-medium">{selectedMethod?.label}</p>
                  {(paymentMethod === 'JazzCash' || paymentMethod === 'EasyPaisa') && paymentDetails.phone && (
                    <p className="text-gray-500">{paymentDetails.phone}</p>
                  )}
                  {paymentMethod === 'BankTransfer' && paymentDetails.accountTitle && (
                    <p className="text-gray-500">{paymentDetails.accountTitle} — {paymentDetails.bankName}</p>
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
              <FaCheckCircle/> {loading ? 'Confirming...' : `Confirm & Pay Rs. ${totalFare}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
