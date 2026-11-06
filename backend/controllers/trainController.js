const supabase = require('../config/supabase');

const mapTrain = (t) => !t ? null : {
  _id: t.id, id: t.id,
  trainNumber:   t.train_number,
  trainName:     t.train_name,
  source:        t.source,
  destination:   t.destination,
  departureTime: t.departure_time,
  arrivalTime:   t.arrival_time,
  duration:      t.duration,
  totalDistance: t.total_distance,
  runningDays:   t.running_days || [],
  status:        t.status,
  createdAt:     t.created_at,
  updatedAt:     t.updated_at,
};

const mapCoach = (c) => !c ? null : {
  _id: c.id, id: c.id,
  train:          c.train_id,
  coachNumber:    c.coach_number,
  coachType:      c.coach_type,
  totalSeats:     c.total_seats,
  availableSeats: c.available_seats,
  bookedSeats:    c.booked_seats,
  farePerSeat:    c.fare_per_seat,
  createdAt:      c.created_at,
  updatedAt:      c.updated_at,
};

exports.getTrains = async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    let query = supabase.from('trains').select('*').eq('status', 'Active');

    if (source)      query = query.ilike('source', `%${source}%`);
    if (destination) query = query.ilike('destination', `%${destination}%`);
    if (date) {
      const day = new Date(date).toLocaleString('en-US', { weekday: 'short' });
      query = query.contains('running_days', [day]);
    }

    const { data: trains, error } = await query;
    if (error) throw error;

    const result = await Promise.all(trains.map(async (t) => {
      const { data: coaches } = await supabase.from('coaches').select('*').eq('train_id', t.id);
      const totalAvailable = (coaches || []).reduce((s, c) => s + (c.available_seats || 0), 0);
      return { ...mapTrain(t), coaches: (coaches || []).map(mapCoach), totalAvailable };
    }));

    res.json({ success: true, count: result.length, trains: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTrains = async (req, res) => {
  try {
    const { data: trains, error } = await supabase.from('trains').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, trains: trains.map(mapTrain) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTrain = async (req, res) => {
  try {
    const { data: train, error } = await supabase.from('trains').select('*').eq('id', req.params.id).single();
    if (error || !train) return res.status(404).json({ success: false, message: 'Train not found' });

    const { data: coaches } = await supabase.from('coaches').select('*').eq('train_id', train.id);
    res.json({ success: true, train: { ...mapTrain(train), coaches: (coaches || []).map(mapCoach) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const VALID_STATUS = ['Active', 'Inactive', 'Delayed', 'Cancelled'];
const VALID_DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Turn the raw form body into a clean row for the trains table.
 * Returns { row } or { message } describing the first validation problem.
 * With partial = true (updates) only the fields that were sent are included.
 */
const buildTrainRow = (body, partial = false) => {
  const str = (v) => (v === undefined || v === null ? undefined : String(v).trim());
  const row = {};

  const required = {
    train_number:   ['trainNumber',   'Train number'],
    train_name:     ['trainName',     'Train name'],
    source:         ['source',        'Source city'],
    destination:    ['destination',   'Destination city'],
    departure_time: ['departureTime', 'Departure time'],
    arrival_time:   ['arrivalTime',   'Arrival time'],
  };
  for (const [col, [key, label]] of Object.entries(required)) {
    const v = str(body[key]);
    if (v === undefined && partial) continue;
    if (!v) return { message: `${label} is required` };
    row[col] = v;
  }

  if (body.duration !== undefined) row.duration = str(body.duration) || null;

  if (body.totalDistance !== undefined) {
    const raw = str(body.totalDistance);
    if (!raw) row.total_distance = null;
    else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return { message: 'Distance must be a positive number' };
      row.total_distance = n;
    }
  }

  if (body.runningDays !== undefined) {
    const days = Array.isArray(body.runningDays) ? body.runningDays.filter((d) => VALID_DAYS.includes(d)) : [];
    row.running_days = days;
  } else if (!partial) {
    row.running_days = [];
  }

  if (body.status !== undefined || !partial) {
    const s = str(body.status) || 'Active';
    if (!VALID_STATUS.includes(s)) return { message: `Status must be one of: ${VALID_STATUS.join(', ')}` };
    row.status = s;
  }

  return { row };
};

/** Translate database errors into messages an admin can act on. */
const friendlyDbError = (error, row) => {
  if (error?.code === '23505') return `Train number ${row.train_number || ''} already exists`.replace('  ', ' ');
  if (error?.code === '22P02') return 'One of the fields has an invalid value';
  return error?.message || 'Could not save train';
};

exports.createTrain = async (req, res) => {
  try {
    const { row, message } = buildTrainRow(req.body);
    if (message) return res.status(400).json({ success: false, message });

    const { data: train, error } = await supabase.from('trains').insert(row).select().single();
    if (error) return res.status(400).json({ success: false, message: friendlyDbError(error, row) });

    res.status(201).json({ success: true, train: mapTrain(train) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTrain = async (req, res) => {
  try {
    const { row: patch, message } = buildTrainRow(req.body, true);
    if (message) return res.status(400).json({ success: false, message });
    patch.updated_at = new Date().toISOString();

    const { data: train, error } = await supabase
      .from('trains').update(patch).eq('id', req.params.id).select().maybeSingle();
    if (error) return res.status(400).json({ success: false, message: friendlyDbError(error, patch) });
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, train: mapTrain(train) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTrain = async (req, res) => {
  try {
    const { error } = await supabase.from('trains').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Train deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
