const router = require('express').Router();
const { getDashboard, getReports } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/reports',   protect, adminOnly, getReports);

module.exports = router;
