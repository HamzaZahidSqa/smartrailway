const Train = require('../models/Train');
const Coach = require('../models/Coach');

exports.getTrains = async (req, res) => {
  try {
    const { source, destination, date, passengers } = req.query;
    let query = {};
    if (source)      query.source      = new RegExp(source, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (date) {
      const day = new Date(date).toLocaleString('en-US', { weekday: 'short' });
      query.runningDays = day;
    }
    query.status = 'Active';
    const trains = await Train.find(query);
    const result = await Promise.all(trains.map(async (t) => {
      const coaches = await Coach.find({ train: t._id });
      const totalAvailable = coaches.reduce((s, c) => s + c.availableSeats, 0);
      return { ...t.toObject(), coaches, totalAvailable };
    }));
    res.json({ success: true, count: result.length, trains: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTrains = async (req, res) => {
  try {
    const trains = await Train.find().sort('-createdAt');
    res.json({ success: true, trains });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTrain = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const coaches = await Coach.find({ train: train._id });
    res.json({ success: true, train: { ...train.toObject(), coaches } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTrain = async (req, res) => {
  try {
    const train = await Train.create(req.body);
    res.status(201).json({ success: true, train });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTrain = async (req, res) => {
  try {
    const train = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, train });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTrain = async (req, res) => {
  try {
    const train = await Train.findByIdAndDelete(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    await Coach.deleteMany({ train: req.params.id });
    res.json({ success: true, message: 'Train deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
