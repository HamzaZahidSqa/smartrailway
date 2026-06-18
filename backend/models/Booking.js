const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  age:    { type: Number, required: true },
  gender: { type: String, enum: ['Male','Female','Other'], required: true },
  idType: { type: String },
  idNumber: { type: String },
  seatNumber: { type: String },
});

const bookingSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  train:        { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  coach:        { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  pnr:          { type: String, unique: true },
  travelDate:   { type: Date, required: true },
  fromCity:     { type: String, required: true },
  toCity:       { type: String, required: true },
  passengers:   [passengerSchema],
  seats:        [{ type: String }],
  totalFare:    { type: Number, required: true },
  status:       { type: String, enum: ['Confirmed','WaitingList','Cancelled','Completed'], default: 'Confirmed' },
  paymentStatus:{ type: String, enum: ['Pending','Paid','Refunded'], default: 'Paid' },
  cancelledAt:  { type: Date },
  refundAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
