const Seat  = require('../models/Seat');
const Coach = require('../models/Coach');

exports.getSeatsByCoach = async (req, res) => {
  try {
    const { coachId, date } = req.query;
    if (!coachId) return res.status(400).json({ success: false, message: 'coachId required' });
    const travelDate = date ? new Date(date) : null;
    let seats = await Seat.find({ coach: coachId }).sort('seatNumber');
    if (travelDate) {
      const startOfDay = new Date(travelDate); startOfDay.setHours(0,0,0,0);
      const endOfDay   = new Date(travelDate); endOfDay.setHours(23,59,59,999);
      const bookedSeats = await Seat.find({
        coach: coachId,
        travelDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'Booked',
      }).select('seatNumber');
      const bookedNums = new Set(bookedSeats.map(s => s.seatNumber));
      seats = seats.map(s => ({ ...s.toObject(), status: bookedNums.has(s.seatNumber) ? 'Booked' : 'Available' }));
    }
    res.json({ success: true, seats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
