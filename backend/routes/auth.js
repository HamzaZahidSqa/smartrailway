const router = require('express').Router();
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/send-otp',        sendOtp);
router.post('/verify-otp',      verifyOtp);

module.exports = router;
