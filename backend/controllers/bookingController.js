const Booking = require('../models/Booking');
const Ticket  = require('../models/Ticket');
const Payment = require('../models/Payment');
const Coach   = require('../models/Coach');
const Seat    = require('../models/Seat');
const { v4: uuidv4 } = require('uuid');

const genPNR = () => 'PNR' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2,5).toUpperCase();
const genTicket = () => 'TKT' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2,4).toUpperCase();

exports.createBooking = async (req, res) => {
  try {
    const { trainId, coachId, travelDate, fromCity, toCity, passengers, seats, totalFare, paymentMethod, paymentDetails } = req.body;
    const coach = await Coach.findById(coachId);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    if (coach.availableSeats < seats.length)
      return res.status(400).json({ success: false, message: 'Not enough seats' });

    const pnr = genPNR();
    const booking = await Booking.create({
      user: req.user._id, train: trainId, coach: coachId,
      pnr, travelDate, fromCity, toCity, passengers, seats, totalFare,
    });

    // Mark seats as booked
    const tDate = new Date(travelDate);
    await Seat.updateMany(
      { coach: coachId, seatNumber: { $in: seats } },
      { status: 'Booked', travelDate: tDate, booking: booking._id }
    );

    coach.availableSeats -= seats.length;
    coach.bookedSeats    += seats.length;
    await coach.save();

    const ticket = await Ticket.create({ booking: booking._id, ticketNumber: genTicket(), pnr });
    await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: totalFare,
      method: paymentMethod || 'JazzCash',
      paymentDetails: paymentDetails || {},
      transactionId: uuidv4(),
    });

    await booking.populate(['train', 'coach']);
    res.status(201).json({ success: true, booking, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('train', 'trainNumber trainName source destination departureTime arrivalTime')
      .populate('coach', 'coachNumber coachType farePerSeat')
      .sort('-createdAt');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('train')
      .populate('coach')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    const ticket = await Ticket.findOne({ booking: booking._id });
    res.json({ success: true, booking, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status === 'Cancelled')
      return res.status(400).json({ success: false, message: 'Already cancelled' });

    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursLeft = (travelDate - now) / (1000 * 60 * 60);
    let refundPct = hoursLeft > 48 ? 0.9 : hoursLeft > 24 ? 0.5 : 0.25;
    const refundAmount = Math.round(booking.totalFare * refundPct);

    booking.status = 'Cancelled';
    booking.cancelledAt = now;
    booking.refundAmount = refundAmount;
    booking.paymentStatus = 'Refunded';
    await booking.save();

    await Seat.updateMany(
      { booking: booking._id },
      { status: 'Available', booking: null, travelDate: null }
    );

    const coach = await Coach.findById(booking.coach);
    coach.availableSeats += booking.seats.length;
    coach.bookedSeats    -= booking.seats.length;
    await coach.save();

    await Payment.findOneAndUpdate({ booking: booking._id }, { status: 'Refunded', refundAmount, refundedAt: now });

    res.json({ success: true, message: 'Booking cancelled', refundAmount, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('train', 'trainNumber trainName')
      .populate('user', 'name email')
      .populate('coach', 'coachNumber coachType')
      .sort('-createdAt');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
