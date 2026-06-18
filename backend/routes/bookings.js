const router = require('express').Router();
const { createBooking, getMyBookings, getBooking, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/',          protect, createBooking);
router.get('/my',         protect, getMyBookings);
router.get('/all',        protect, adminOnly, getAllBookings);
router.get('/:id',        protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
