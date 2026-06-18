const router = require('express').Router();
const Route  = require('../models/Route');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().populate('train','trainNumber trainName');
    res.json({ success: true, routes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/train/:trainId', async (req, res) => {
  try {
    const route = await Route.findOne({ train: req.params.trainId }).populate('train');
    res.json({ success: true, route });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ success: true, route });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, route });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
