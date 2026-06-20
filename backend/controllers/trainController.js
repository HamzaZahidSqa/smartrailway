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

exports.createTrain = async (req, res) => {
  try {
    const { trainNumber, trainName, source, destination, departureTime, arrivalTime, duration, totalDistance, runningDays, status } = req.body;
    const { data: train, error } = await supabase
      .from('trains')
      .insert({ train_number: trainNumber, train_name: trainName, source, destination, departure_time: departureTime, arrival_time: arrivalTime, duration, total_distance: totalDistance, running_days: runningDays, status })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, train: mapTrain(train) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTrain = async (req, res) => {
  try {
    const { trainNumber, trainName, source, destination, departureTime, arrivalTime, duration, totalDistance, runningDays, status } = req.body;
    const patch = {};
    if (trainNumber   !== undefined) patch.train_number   = trainNumber;
    if (trainName     !== undefined) patch.train_name     = trainName;
    if (source        !== undefined) patch.source         = source;
    if (destination   !== undefined) patch.destination    = destination;
    if (departureTime !== undefined) patch.departure_time = departureTime;
    if (arrivalTime   !== undefined) patch.arrival_time   = arrivalTime;
    if (duration      !== undefined) patch.duration       = duration;
    if (totalDistance !== undefined) patch.total_distance = totalDistance;
    if (runningDays   !== undefined) patch.running_days   = runningDays;
    if (status        !== undefined) patch.status         = status;

    const { data: train, error } = await supabase
      .from('trains').update(patch).eq('id', req.params.id).select().single();
    if (error || !train) return res.status(404).json({ success: false, message: 'Train not found' });
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
