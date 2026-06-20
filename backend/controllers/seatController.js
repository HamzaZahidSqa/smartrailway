const supabase = require('../config/supabase');

const mapSeat = (s) => !s ? null : {
  _id: s.id, id: s.id,
  coach:      s.coach_id,
  train:      s.train_id,
  seatNumber: s.seat_number,
  row:        s.row,
  column:     s.col,
  status:     s.status,
  travelDate: s.travel_date,
  booking:    s.booking_id,
};

exports.getSeatsByCoach = async (req, res) => {
  try {
    const { coachId, date } = req.query;
    if (!coachId) return res.status(400).json({ success: false, message: 'coachId required' });

    const { data: seats, error } = await supabase.from('seats').select('*').eq('coach_id', coachId).order('seat_number');
    if (error) throw error;

    if (date) {
      const travelDate = new Date(date).toISOString().split('T')[0];
      const { data: bookedSeats } = await supabase
        .from('seats')
        .select('seat_number')
        .eq('coach_id', coachId)
        .eq('travel_date', travelDate)
        .eq('status', 'Booked');
      const bookedNums = new Set((bookedSeats || []).map((s) => s.seat_number));
      return res.json({
        success: true,
        seats: seats.map((s) => ({ ...mapSeat(s), status: bookedNums.has(s.seat_number) ? 'Booked' : 'Available' })),
      });
    }

    res.json({ success: true, seats: seats.map(mapSeat) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
