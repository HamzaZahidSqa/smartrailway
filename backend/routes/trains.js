const router = require('express').Router();
const { getTrains, getAllTrains, getTrain, createTrain, updateTrain, deleteTrain } = require('../controllers/trainController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/search', getTrains);
router.get('/all',    protect, adminOnly, getAllTrains);
router.get('/:id',   getTrain);
router.post('/',     protect, adminOnly, createTrain);
router.put('/:id',   protect, adminOnly, updateTrain);
router.delete('/:id',protect, adminOnly, deleteTrain);

module.exports = router;
