const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const genPNR    = () => 'PNR' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 5).toUpperCase();
const genTicket = () => 'TKT' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 4).toUpperCase();

const mapTrain = (t) => !t ? null : {
  _id: t.id, id: t.id,
  trainNumber: t.train_number, trainName: t.train_name,
  source: t.source, destination: t.destination,
  departureTime: t.departure_time, arrivalTime: t.arrival_time,
};

const mapCoach = (c) => !c ? null : {
  _id: c.id, id: c.id,
  coachNumber: c.coach_number, coachType: c.coach_type, farePerSeat: c.fare_per_seat,
};

const mapBooking = (b) => !b ? null : {
  _id: b.id, id: b.id,
  user:          b.user_id,
  train:         b.train_id,
  coach:         b.coach_id,
  pnr:           b.pnr,
  travelDate:    b.travel_date,
  fromCity:      b.from_city,
  toCity:        b.to_city,
  seats:         b.seats || [],
  passengers:    b.booking_passengers || [],
  totalFare:     b.total_fare,
  status:        b.status,
  paymentStatus: b.payment_status,
  cancelledAt:   b.cancelled_at,
  refundAmount:  b.refund_amount,
  createdAt:     b.created_at,
  updatedAt:     b.updated_at,
};

exports.createBooking = async (req, res) => {
  try {
    const { trainId, coachId, travelDate, fromCity, toCity, passengers, seats, totalFare, paymentMethod, paymentDetails } = req.body;

    const { data: coach } = await supabase.from('coaches').select('*').eq('id', coachId).single();
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    if (coach.available_seats < seats.length)
      return res.status(400).json({ success: false, message: 'Not enough seats' });

    const pnr = genPNR();
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({ user_id: req.user.id, train_id: trainId, coach_id: coachId, pnr, travel_date: travelDate, from_city: fromCity, to_city: toCity, seats, total_fare: totalFare })
      .select()
      .single();
    if (bookErr) throw bookErr;

    // Insert passengers
    if (passengers?.length) {
      const passengerRows = passengers.map((p) => ({
        booking_id:  booking.id,
        name:        p.name,
        age:         p.age,
        gender:      p.gender,
        id_type:     p.idType,
        id_number:   p.idNumber,
        seat_number: p.seatNumber,
      }));
      await supabase.from('booking_passengers').insert(passengerRows);
    }

    // Mark seats as booked
    const tDate = new Date(travelDate).toISOString().split('T')[0];
    await supabase
      .from('seats')
      .update({ status: 'Booked', travel_date: tDate, booking_id: booking.id })
      .eq('coach_id', coachId)
      .in('seat_number', seats);

    // Update coach availability
    await supabase
      .from('coaches')
      .update({ available_seats: coach.available_seats - seats.length, booked_seats: coach.booked_seats + seats.length })
      .eq('id', coachId);

    // Create ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .insert({ booking_id: booking.id, ticket_number: genTicket(), pnr })
      .select()
      .single();

    // Create payment
    await supabase.from('payments').insert({
      booking_id:     booking.id,
      user_id:        req.user.id,
      amount:         totalFare,
      method:         paymentMethod || 'JazzCash',
      transaction_id: uuidv4(),
      payment_phone:  paymentDetails?.phone,
      account_title:  paymentDetails?.accountTitle,
      account_number: paymentDetails?.accountNumber,
      bank_name:      paymentDetails?.bankName,
      iban:           paymentDetails?.iban,
    });

    // Populate train & coach for response
    const { data: train } = await supabase.from('trains').select('*').eq('id', trainId).single();
    const mapped = { ...mapBooking(booking), train: mapTrain(train), coach: mapCoach(coach) };
    res.status(201).json({ success: true, booking: mapped, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, trains(train_number,train_name,source,destination,departure_time,arrival_time), coaches(coach_number,coach_type,fare_per_seat), booking_passengers(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const result = bookings.map((b) => ({
      ...mapBooking(b),
      train: mapTrain(b.trains),
      coach: mapCoach(b.coaches),
      passengers: b.booking_passengers || [],
    }));
    res.json({ success: true, bookings: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const { data: b, error } = await supabase
      .from('bookings')
      .select('*, trains(*), coaches(*), users(name,email,phone), booking_passengers(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !b) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (b.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { data: ticket } = await supabase.from('tickets').select('*').eq('booking_id', b.id).maybeSingle();
    const booking = {
      ...mapBooking(b),
      train: mapTrain(b.trains),
      coach: mapCoach(b.coaches),
      user:  b.users ? { _id: b.user_id, id: b.user_id, ...b.users } : b.user_id,
      passengers: b.booking_passengers || [],
    };
    res.json({ success: true, booking, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', req.params.id).single();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });

    const now = new Date();
    const hoursLeft = (new Date(booking.travel_date) - now) / (1000 * 60 * 60);
    const refundPct = hoursLeft > 48 ? 0.9 : hoursLeft > 24 ? 0.5 : 0.25;
    const refundAmount = Math.round(booking.total_fare * refundPct);

    const { data: updated } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled', cancelled_at: now.toISOString(), refund_amount: refundAmount, payment_status: 'Refunded' })
      .eq('id', booking.id)
      .select()
      .single();

    // Free the seats
    await supabase
      .from('seats')
      .update({ status: 'Available', booking_id: null, travel_date: null })
      .eq('booking_id', booking.id);

    // Update coach counts
    const { data: coach } = await supabase.from('coaches').select('*').eq('id', booking.coach_id).single();
    if (coach) {
      await supabase.from('coaches').update({
        available_seats: coach.available_seats + (booking.seats?.length || 0),
        booked_seats:    Math.max(0, coach.booked_seats - (booking.seats?.length || 0)),
      }).eq('id', coach.id);
    }

    await supabase.from('payments')
      .update({ status: 'Refunded', refund_amount: refundAmount, refunded_at: now.toISOString() })
      .eq('booking_id', booking.id);

    res.json({ success: true, message: 'Booking cancelled', refundAmount, booking: mapBooking(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, trains(train_number,train_name), users(name,email), coaches(coach_number,coach_type), booking_passengers(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const result = bookings.map((b) => ({
      ...mapBooking(b),
      train: b.trains ? { _id: b.train_id, id: b.train_id, trainNumber: b.trains.train_number, trainName: b.trains.train_name } : b.train_id,
      user:  b.users  ? { _id: b.user_id,  id: b.user_id,  ...b.users } : b.user_id,
      coach: b.coaches ? { _id: b.coach_id, id: b.coach_id, coachNumber: b.coaches.coach_number, coachType: b.coaches.coach_type } : b.coach_id,
      passengers: b.booking_passengers || [],
    }));
    res.json({ success: true, bookings: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
