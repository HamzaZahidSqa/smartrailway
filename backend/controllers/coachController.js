const supabase = require('../config/supabase');

const mapCoach = (c) => !c ? null : {
  _id: c.id, id: c.id,
  train:          c.train_id,
  coachNumber:    c.coach_number,
  coachType:      c.coach_type,
  totalSeats:     c.total_seats,
  availableSeats: c.available_seats,
  bookedSeats:    c.booked_seats,
  farePerSeat:    c.fare_per_seat,
  createdAt:      c.created_at,
  updatedAt:      c.updated_at,
};

exports.getCoachesByTrain = async (req, res) => {
  try {
    const { data: coaches, error } = await supabase.from('coaches').select('*').eq('train_id', req.params.trainId);
    if (error) throw error;
    res.json({ success: true, coaches: coaches.map(mapCoach) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoach = async (req, res) => {
  try {
    const { trainId, coachNumber, coachType, totalSeats, farePerSeat } = req.body;
    const { data: coach, error } = await supabase
      .from('coaches')
      .insert({ train_id: trainId, coach_number: coachNumber, coach_type: coachType, total_seats: totalSeats, available_seats: totalSeats, booked_seats: 0, fare_per_seat: farePerSeat })
      .select()
      .single();
    if (error) throw error;

    // Auto-generate seat rows
    const seats = [];
    const cols = ['A', 'B', 'C', 'D'];
    for (let i = 1; i <= coach.total_seats; i++) {
      seats.push({ coach_id: coach.id, train_id: coach.train_id, seat_number: `${coach.coach_number}-${i}`, row: Math.ceil(i / 4), col: cols[(i - 1) % 4] });
    }
    await supabase.from('seats').insert(seats);

    res.status(201).json({ success: true, coach: mapCoach(coach) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCoach = async (req, res) => {
  try {
    const { coachNumber, coachType, totalSeats, availableSeats, bookedSeats, farePerSeat } = req.body;
    const patch = {};
    if (coachNumber    !== undefined) patch.coach_number    = coachNumber;
    if (coachType      !== undefined) patch.coach_type      = coachType;
    if (totalSeats     !== undefined) patch.total_seats     = totalSeats;
    if (availableSeats !== undefined) patch.available_seats = availableSeats;
    if (bookedSeats    !== undefined) patch.booked_seats    = bookedSeats;
    if (farePerSeat    !== undefined) patch.fare_per_seat   = farePerSeat;

    const { data: coach, error } = await supabase.from('coaches').update(patch).eq('id', req.params.id).select().single();
    if (error || !coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    res.json({ success: true, coach: mapCoach(coach) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCoach = async (req, res) => {
  try {
    await supabase.from('seats').delete().eq('coach_id', req.params.id);
    const { error } = await supabase.from('coaches').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Coach deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
