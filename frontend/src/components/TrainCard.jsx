import { useNavigate } from 'react-router-dom'
import { FaTrain, FaClock, FaRoute, FaChair } from 'react-icons/fa'

export default function TrainCard({ train, searchParams }) {
  const navigate = useNavigate()

  const badgeColor = {
    Economy:   'bg-green-100 text-green-700',
    Sleeper:   'bg-blue-100 text-blue-700',
    Business:  'bg-purple-100 text-purple-700',
    Executive: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="card hover:shadow-xl transition-shadow border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FaTrain className="text-blue-600"/>
            <span className="font-bold text-lg text-blue-800">{train.trainName}</span>
            <span className="text-sm text-gray-500">#{train.trainNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              train.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {train.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-700">
            <div className="text-center">
              <p className="font-bold text-xl">{train.departureTime}</p>
              <p className="text-sm text-gray-500">{train.source}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-gray-400 text-xs"><FaClock/> {train.duration}</div>
              <div className="w-full border-t-2 border-dashed border-gray-300 my-1"/>
              <div className="flex items-center gap-1 text-gray-400 text-xs"><FaRoute/> {train.totalDistance} km</div>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl">{train.arrivalTime}</p>
              <p className="text-sm text-gray-500">{train.destination}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {train.runningDays?.map(d => (
              <span key={d} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">{d}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          {train.coaches?.map(coach => (
            <div key={coach._id} className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded font-medium ${badgeColor[coach.coachType] || 'bg-gray-100 text-gray-700'}`}>
                {coach.coachType}
              </span>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <FaChair className="text-green-500"/> {coach.availableSeats} seats
              </span>
              <span className="font-bold text-blue-700">₹{coach.farePerSeat}</span>
            </div>
          ))}
          <button
            onClick={() => navigate(`/book/${train._id}`, { state: { train, searchParams } })}
            className="btn-primary mt-2 w-full">
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}
