const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:       { type: Number, required: true },
  method:       { type: String, enum: ['JazzCash','EasyPaisa','BankTransfer'], default: 'JazzCash' },
  status:       { type: String, enum: ['Success','Failed','Refunded','Pending'], default: 'Success' },
  transactionId:{ type: String },
  paymentDetails: {
    phone:         { type: String },
    accountTitle:  { type: String },
    accountNumber: { type: String },
    bankName:      { type: String },
    iban:          { type: String },
  },
  refundAmount: { type: Number, default: 0 },
  refundedAt:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
