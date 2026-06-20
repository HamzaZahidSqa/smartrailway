require('dotenv').config();
const supabase = require('../config/supabase');

const trains = [
  {
    train_number: 'T001',
    train_name:   'Karachi Express',
    source:       'Karachi',
    destination:  'Lahore',
    departure_time: '08:00',
    arrival_time:   '22:00',
    duration:       '14h 00m',
    total_distance: 1254,
    running_days:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    status:         'Active',
  },
  {
    train_number: 'T002',
    train_name:   'Tezgam Express',
    source:       'Karachi',
    destination:  'Rawalpindi',
    departure_time: '07:00',
    arrival_time:   '23:30',
    duration:       '16h 30m',
    total_distance: 1467,
    running_days:   ['Mon','Wed','Fri','Sun'],
    status:         'Active',
  },
  {
    train_number: 'T003',
    train_name:   'Khyber Mail',
    source:       'Karachi',
    destination:  'Peshawar',
    departure_time: '06:00',
    arrival_time:   '06:00',
    duration:       '24h 00m',
    total_distance: 1736,
    running_days:   ['Tue','Thu','Sat'],
    status:         'Active',
  },
  {
    train_number: 'T004',
    train_name:   'Green Line',
    source:       'Karachi',
    destination:  'Lahore',
    departure_time: '15:00',
    arrival_time:   '04:30',
    duration:       '13h 30m',
    total_distance: 1254,
    running_days:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    status:         'Active',
  },
  {
    train_number: 'T005',
    train_name:   'Business Express',
    source:       'Karachi',
    destination:  'Lahore',
    departure_time: '14:00',
    arrival_time:   '05:00',
    duration:       '15h 00m',
    total_distance: 1254,
    running_days:   ['Mon','Wed','Fri'],
    status:         'Active',
  },
  {
    train_number: 'T006',
    train_name:   'Awam Express',
    source:       'Karachi',
    destination:  'Peshawar',
    departure_time: '12:00',
    arrival_time:   '14:00',
    duration:       '26h 00m',
    total_distance: 1736,
    running_days:   ['Mon','Thu','Sun'],
    status:         'Active',
  },
  {
    train_number: 'T007',
    train_name:   'Jaffar Express',
    source:       'Rawalpindi',
    destination:  'Quetta',
    departure_time: '09:00',
    arrival_time:   '09:00',
    duration:       '24h 00m',
    total_distance: 1180,
    running_days:   ['Tue','Fri'],
    status:         'Active',
  },
  {
    train_number: 'T008',
    train_name:   'Hazara Express',
    source:       'Karachi',
    destination:  'Havelian',
    departure_time: '10:00',
    arrival_time:   '08:00',
    duration:       '22h 00m',
    total_distance: 1590,
    running_days:   ['Mon','Wed','Sat'],
    status:         'Active',
  },
  {
    train_number: 'T009',
    train_name:   'Shah Hussein Express',
    source:       'Lahore',
    destination:  'Karachi',
    departure_time: '18:00',
    arrival_time:   '10:00',
    duration:       '16h 00m',
    total_distance: 1254,
    running_days:   ['Tue','Thu','Sat','Sun'],
    status:         'Active',
  },
  {
    train_number: 'T010',
    train_name:   'Islamabad Express',
    source:       'Karachi',
    destination:  'Islamabad',
    departure_time: '16:00',
    arrival_time:   '07:00',
    duration:       '15h 00m',
    total_distance: 1398,
    running_days:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    status:         'Active',
  },
];

const coaches = [
  { coach_number: 'C1', coach_type: 'Economy',   total_seats: 60, fare_per_seat: 1500 },
  { coach_number: 'C2', coach_type: 'Business',  total_seats: 40, fare_per_seat: 3000 },
  { coach_number: 'C3', coach_type: 'Executive', total_seats: 24, fare_per_seat: 5000 },
];

async function seed() {
  console.log('Seeding trains...');

  for (const train of trains) {
    const { data: t, error } = await supabase.from('trains').insert(train).select().single();
    if (error) { console.error(`Train ${train.train_number} error:`, error.message); continue; }
    console.log(`✓ Train inserted: ${t.train_name}`);

    for (const c of coaches) {
      const { data: coach, error: ce } = await supabase
        .from('coaches')
        .insert({ train_id: t.id, coach_number: c.coach_number, coach_type: c.coach_type, total_seats: c.total_seats, available_seats: c.total_seats, booked_seats: 0, fare_per_seat: c.fare_per_seat })
        .select().single();
      if (ce) { console.error(`  Coach error:`, ce.message); continue; }

      const seats = [];
      const cols = ['A','B','C','D'];
      for (let i = 1; i <= coach.total_seats; i++) {
        seats.push({ coach_id: coach.id, train_id: t.id, seat_number: `${coach.coach_number}-${i}`, row: Math.ceil(i / 4), col: cols[(i-1) % 4] });
      }
      await supabase.from('seats').insert(seats);
      console.log(`  ✓ Coach ${coach.coach_number} (${c.coach_type}) + ${c.total_seats} seats`);
    }
  }

  console.log('\nDone! 10 trains seeded with coaches and seats.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
