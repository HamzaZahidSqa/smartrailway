const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  train:       { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  stations: [{
    city:          { type: String, required: true },
    arrivalTime:   { type: String },
    departureTime: { type: String },
    stopNumber:    { type: Number },
    distance:      { type: Number },
  }],
  scheduleType: { type: String, enum: ['Daily','Weekly'], default: 'Daily' },
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
