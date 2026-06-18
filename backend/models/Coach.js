const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  train:          { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  coachNumber:    { type: String, required: true },
  coachType:      { type: String, enum: ['Economy','Business','Executive','Sleeper'], required: true },
  totalSeats:     { type: Number, required: true },
  availableSeats: { type: Number },
  bookedSeats:    { type: Number, default: 0 },
  farePerSeat:    { type: Number, required: true },
}, { timestamps: true });

coachSchema.pre('save', function (next) {
  if (this.isNew) this.availableSeats = this.totalSeats;
  next();
});

module.exports = mongoose.model('Coach', coachSchema);
