const Coach = require('../models/Coach');
const Seat  = require('../models/Seat');

exports.getCoachesByTrain = async (req, res) => {
  try {
    const coaches = await Coach.find({ train: req.params.trainId });
    res.json({ success: true, coaches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoach = async (req, res) => {
  try {
    const coach = await Coach.create({ ...req.body, availableSeats: req.body.totalSeats });
    // Auto-generate seat documents
    const seats = [];
    for (let i = 1; i <= coach.totalSeats; i++) {
      seats.push({ coach: coach._id, train: coach.train, seatNumber: `${coach.coachNumber}-${i}`, row: Math.ceil(i / 4), column: ['A','B','C','D'][(i - 1) % 4] });
    }
    await Seat.insertMany(seats);
    res.status(201).json({ success: true, coach });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCoach = async (req, res) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    res.json({ success: true, coach });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCoach = async (req, res) => {
  try {
    await Coach.findByIdAndDelete(req.params.id);
    await Seat.deleteMany({ coach: req.params.id });
    res.json({ success: true, message: 'Coach deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
