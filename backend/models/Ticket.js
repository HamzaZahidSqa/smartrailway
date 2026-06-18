const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  ticketNumber: { type: String, unique: true },
  pnr:          { type: String },
  issuedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
