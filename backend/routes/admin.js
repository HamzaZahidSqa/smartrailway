const router = require('express').Router();
const { getDashboard, getReports, getUsers } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/reports',   protect, adminOnly, getReports);
router.get('/users',     protect, adminOnly, getUsers);

module.exports = router;
