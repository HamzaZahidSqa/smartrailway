const router   = require('express').Router();
const supabase  = require('../config/supabase');
const { protect, adminOnly } = require('../middleware/auth');

const mapStation = (s) => ({ city: s.city, arrivalTime: s.arrival_time, departureTime: s.departure_time, stopNumber: s.stop_number, distance: s.distance });

const mapRoute = (r) => !r ? null : {
  _id: r.id, id: r.id,
  train:        r.train_id,
  scheduleType: r.schedule_type,
  stations:     (r.route_stations || []).map(mapStation),
  createdAt:    r.created_at,
};

router.get('/', async (req, res) => {
  try {
    const { data: routes, error } = await supabase
      .from('routes')
      .select('*, trains(train_number,train_name), route_stations(*)');
    if (error) throw error;
    res.json({ success: true, routes: routes.map((r) => ({ ...mapRoute(r), train: r.trains ? { _id: r.train_id, id: r.train_id, trainNumber: r.trains.train_number, trainName: r.trains.train_name } : r.train_id })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/train/:trainId', async (req, res) => {
  try {
    const { data: route, error } = await supabase
      .from('routes')
      .select('*, trains(*), route_stations(*)')
      .eq('train_id', req.params.trainId)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, route: route ? { ...mapRoute(route), train: route.trains } : null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { train, scheduleType, stations } = req.body;
    const { data: route, error } = await supabase
      .from('routes')
      .insert({ train_id: train, schedule_type: scheduleType })
      .select()
      .single();
    if (error) throw error;

    if (stations?.length) {
      const rows = stations.map((s) => ({ route_id: route.id, city: s.city, arrival_time: s.arrivalTime, departure_time: s.departureTime, stop_number: s.stopNumber, distance: s.distance }));
      await supabase.from('route_stations').insert(rows);
    }
    res.status(201).json({ success: true, route: mapRoute(route) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { scheduleType, stations } = req.body;
    const { data: route, error } = await supabase
      .from('routes')
      .update({ schedule_type: scheduleType })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    if (stations) {
      await supabase.from('route_stations').delete().eq('route_id', route.id);
      const rows = stations.map((s) => ({ route_id: route.id, city: s.city, arrival_time: s.arrivalTime, departure_time: s.departureTime, stop_number: s.stopNumber, distance: s.distance }));
      await supabase.from('route_stations').insert(rows);
    }
    res.json({ success: true, route: mapRoute(route) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('routes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
