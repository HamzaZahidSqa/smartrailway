const router = require('express').Router();
const { getCoachesByTrain, createCoach, updateCoach, deleteCoach } = require('../controllers/coachController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/train/:trainId', getCoachesByTrain);
router.post('/',      protect, adminOnly, createCoach);
router.put('/:id',    protect, adminOnly, updateCoach);
router.delete('/:id', protect, adminOnly, deleteCoach);

module.exports = router;
