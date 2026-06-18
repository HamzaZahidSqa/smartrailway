const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
  trainNumber:   { type: String, required: true, unique: true },
  trainName:     { type: String, required: true },
  source:        { type: String, required: true },
  destination:   { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime:   { type: String, required: true },
  duration:      { type: String },
  totalDistance: { type: Number },
  runningDays:   [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],
  status:        { type: String, enum: ['Active','Inactive','Delayed','Cancelled'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
