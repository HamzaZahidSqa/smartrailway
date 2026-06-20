const router   = require('express').Router();
const supabase  = require('../config/supabase');
const { protect } = require('../middleware/auth');

const mapTrain = (t) => !t ? null : { _id: t.id, id: t.id, trainNumber: t.train_number, trainName: t.train_name, source: t.source, destination: t.destination, departureTime: t.departure_time, arrivalTime: t.arrival_time };
const mapCoach = (c) => !c ? null : { _id: c.id, id: c.id, coachNumber: c.coach_number, coachType: c.coach_type, farePerSeat: c.fare_per_seat };

router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, bookings(*, trains(*), coaches(*), users(name,email,phone), booking_passengers(*))')
      .eq('booking_id', req.params.bookingId)
      .maybeSingle();
    if (error || !ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const b = ticket.bookings;
    const booking = b ? {
      _id: b.id, id: b.id,
      pnr: b.pnr, travelDate: b.travel_date, fromCity: b.from_city, toCity: b.to_city,
      seats: b.seats, totalFare: b.total_fare, status: b.status, paymentStatus: b.payment_status,
      train:      mapTrain(b.trains),
      coach:      mapCoach(b.coaches),
      user:       b.users ? { _id: b.user_id, id: b.user_id, ...b.users } : b.user_id,
      passengers: b.booking_passengers || [],
    } : null;

    res.json({ success: true, ticket: { ...ticket, bookings: undefined, booking } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/pnr/:pnr', async (req, res) => {
  try {
    const { data: b, error } = await supabase
      .from('bookings')
      .select('*, trains(*), coaches(*), users(name,email,phone), booking_passengers(*)')
      .eq('pnr', req.params.pnr)
      .maybeSingle();
    if (error || !b) return res.status(404).json({ success: false, message: 'PNR not found' });

    const { data: ticket } = await supabase.from('tickets').select('*').eq('booking_id', b.id).maybeSingle();
    const booking = {
      _id: b.id, id: b.id,
      pnr: b.pnr, travelDate: b.travel_date, fromCity: b.from_city, toCity: b.to_city,
      seats: b.seats, totalFare: b.total_fare, status: b.status,
      train:      mapTrain(b.trains),
      coach:      mapCoach(b.coaches),
      user:       b.users ? { _id: b.user_id, id: b.user_id, ...b.users } : b.user_id,
      passengers: b.booking_passengers || [],
    };
    res.json({ success: true, booking, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
