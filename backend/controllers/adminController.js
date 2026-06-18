const Booking = require('../models/Booking');
const Train   = require('../models/Train');
const User    = require('../models/User');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res) => {
  try {
    const [totalTrains, totalBookings, totalUsers, revenueResult, recentBookings] = await Promise.all([
      Train.countDocuments({ status: 'Active' }),
      Booking.countDocuments(),
      User.countDocuments({ role: 'passenger' }),
      Payment.aggregate([{ $match: { status: 'Success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Booking.find().populate('train','trainNumber trainName').populate('user','name email').sort('-createdAt').limit(10),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const confirmed    = await Booking.countDocuments({ status: 'Confirmed' });
    const cancelled    = await Booking.countDocuments({ status: 'Cancelled' });

    res.json({ success: true, stats: { totalTrains, totalBookings, totalUsers, totalRevenue, confirmed, cancelled }, recentBookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type } = req.query; // daily | monthly | routes
    let data = {};

    if (type === 'monthly') {
      data = await Booking.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalFare' } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]);
    } else if (type === 'routes') {
      data = await Booking.aggregate([
        { $group: { _id: { from: '$fromCity', to: '$toCity' }, count: { $sum: 1 }, revenue: { $sum: '$totalFare' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
    } else {
      const today = new Date(); today.setHours(0,0,0,0);
      data = await Booking.find({ createdAt: { $gte: today } })
        .populate('train','trainName').populate('user','name').sort('-createdAt');
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
