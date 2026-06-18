const router = require('express').Router();
const Ticket  = require('../models/Ticket');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ booking: req.params.bookingId })
      .populate({ path: 'booking', populate: [{ path: 'train' }, { path: 'coach' }, { path: 'user', select: 'name email phone' }] });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/pnr/:pnr', async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr })
      .populate('train').populate('coach').populate('user','name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'PNR not found' });
    const ticket = await Ticket.findOne({ booking: booking._id });
    res.json({ success: true, booking, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
