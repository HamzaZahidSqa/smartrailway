const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  coach:      { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  train:      { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  seatNumber: { type: String, required: true },
  row:        { type: Number },
  column:     { type: String },
  status:     { type: String, enum: ['Available','Booked','Reserved'], default: 'Available' },
  travelDate: { type: Date },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
}, { timestamps: true });

seatSchema.index({ coach: 1, seatNumber: 1, travelDate: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
