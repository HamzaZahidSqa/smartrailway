require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User  = require('../models/User');
const Train = require('../models/Train');
const Coach = require('../models/Coach');
const Seat  = require('../models/Seat');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  await User.deleteMany(); await Train.deleteMany(); await Coach.deleteMany(); await Seat.deleteMany();

  const adminPass = await bcrypt.hash('Admin@123', 10);
  const userPass  = await bcrypt.hash('User@123', 10);

  await User.insertMany([
    { name: 'Admin User', email: 'admin@railway.com', password: adminPass, role: 'admin', phone: '9000000001' },
    { name: 'John Doe',   email: 'john@example.com',  password: userPass,  role: 'passenger', phone: '9000000002' },
  ]);

  const trains = await Train.insertMany([
    { trainNumber:'10001', trainName:'Karachi Express',    source:'Karachi',    destination:'Lahore',     departureTime:'08:00', arrivalTime:'20:30', duration:'12h 30m', totalDistance:1210, runningDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], status:'Active' },
    { trainNumber:'10002', trainName:'Awam Express',       source:'Lahore',     destination:'Islamabad',  departureTime:'07:00', arrivalTime:'11:30', duration:'4h 30m',  totalDistance:375,  runningDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], status:'Active' },
    { trainNumber:'10003', trainName:'Tezgam Express',     source:'Karachi',    destination:'Islamabad',  departureTime:'15:00', arrivalTime:'09:00', duration:'18h',     totalDistance:1585, runningDays:['Mon','Wed','Fri','Sun'], status:'Active' },
    { trainNumber:'10004', trainName:'Khyber Mail',        source:'Lahore',     destination:'Peshawar',   departureTime:'06:00', arrivalTime:'14:30', duration:'8h 30m',  totalDistance:525,  runningDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], status:'Active' },
    { trainNumber:'10005', trainName:'Jaffar Express',     source:'Islamabad',  destination:'Quetta',     departureTime:'18:00', arrivalTime:'16:00', duration:'22h',     totalDistance:1240, runningDays:['Tue','Thu','Sat'], status:'Active' },
    { trainNumber:'10006', trainName:'Shalimar Express',   source:'Lahore',     destination:'Faisalabad', departureTime:'09:30', arrivalTime:'12:00', duration:'2h 30m',  totalDistance:175,  runningDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], status:'Active' },
    { trainNumber:'10007', trainName:'Karakoram Express',  source:'Karachi',    destination:'Peshawar',   departureTime:'14:00', arrivalTime:'10:30', duration:'20h 30m', totalDistance:1760, runningDays:['Mon','Wed','Fri'], status:'Active' },
    { trainNumber:'10008', trainName:'Green Line Express', source:'Karachi',    destination:'Faisalabad', departureTime:'16:00', arrivalTime:'08:00', duration:'16h',     totalDistance:1385, runningDays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], status:'Active' },
  ]);

  const coachTypes = [
    { coachType:'Economy',   fare:1200  },
    { coachType:'Sleeper',   fare:2500  },
    { coachType:'Business',  fare:4500  },
    { coachType:'Executive', fare:7500  },
  ];

  for (const train of trains) {
    let coachIdx = 1;
    for (const ct of coachTypes) {
      const totalSeats = ct.coachType === 'Economy' ? 72 : ct.coachType === 'Sleeper' ? 64 : 48;
      const coach = await Coach.create({
        train: train._id, coachNumber: `${ct.coachType[0]}${coachIdx++}`,
        coachType: ct.coachType, totalSeats, availableSeats: totalSeats, farePerSeat: ct.fare,
      });
      const seats = [];
      for (let i = 1; i <= totalSeats; i++) {
        seats.push({ coach: coach._id, train: train._id, seatNumber: `${coach.coachNumber}-${i}`, row: Math.ceil(i/4), column: ['A','B','C','D'][(i-1)%4] });
      }
      await Seat.insertMany(seats);
    }
  }

  console.log('Seeding complete!');
  console.log('Admin: admin@railway.com / Admin@123');
  console.log('User:  john@example.com  / User@123');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
