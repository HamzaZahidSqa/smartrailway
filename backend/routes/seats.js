const router = require('express').Router();
const { getSeatsByCoach } = require('../controllers/seatController');

router.get('/', getSeatsByCoach);

module.exports = router;
