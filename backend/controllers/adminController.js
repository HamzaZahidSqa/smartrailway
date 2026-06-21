const supabase = require('../config/supabase');

exports.getDashboard = async (req, res) => {
  try {
    const [
      { count: totalTrains },
      { count: totalBookings },
      { count: totalUsers },
      { data: successPayments },
      { data: recentRaw },
      { count: confirmed },
      { count: cancelled },
    ] = await Promise.all([
      supabase.from('trains').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'passenger'),
      supabase.from('payments').select('amount').eq('status', 'Success'),
      supabase.from('bookings')
        .select('*, trains(train_number,train_name), users(name,email)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Confirmed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Cancelled'),
    ]);

    const totalRevenue = (successPayments || []).reduce((s, p) => s + (p.amount || 0), 0);

    const recentBookings = (recentRaw || []).map((b) => ({
      _id: b.id, id: b.id,
      pnr: b.pnr, status: b.status, totalFare: b.total_fare, travelDate: b.travel_date,
      train: b.trains ? { trainNumber: b.trains.train_number, trainName: b.trains.train_name } : null,
      user:  b.users  ? { name: b.users.name, email: b.users.email } : null,
      createdAt: b.created_at,
    }));

    res.json({ success: true, stats: { totalTrains, totalBookings, totalUsers, totalRevenue, confirmed, cancelled }, recentBookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const result = await Promise.all(users.map(async (u) => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);
      return {
        _id: u.id, id: u.id,
        name: u.name, email: u.email, phone: u.phone,
        role: u.role, createdAt: u.created_at,
        totalBookings: count || 0,
      };
    }));

    res.json({ success: true, users: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type } = req.query;
    let data = {};

    if (type === 'monthly') {
      const { data: bookings } = await supabase.from('bookings').select('created_at, total_fare');
      const grouped = {};
      (bookings || []).forEach((b) => {
        const d = new Date(b.created_at);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!grouped[key]) grouped[key] = { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, count: 0, revenue: 0 };
        grouped[key].count++;
        grouped[key].revenue += b.total_fare || 0;
      });
      data = Object.values(grouped).sort((a, b) => b._id.year - a._id.year || b._id.month - a._id.month).slice(0, 12);

    } else if (type === 'routes') {
      const { data: bookings } = await supabase.from('bookings').select('from_city, to_city, total_fare');
      const grouped = {};
      (bookings || []).forEach((b) => {
        const key = `${b.from_city}||${b.to_city}`;
        if (!grouped[key]) grouped[key] = { _id: { from: b.from_city, to: b.to_city }, count: 0, revenue: 0 };
        grouped[key].count++;
        grouped[key].revenue += b.total_fare || 0;
      });
      data = Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 10);

    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, trains(train_name), users(name)')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });
      data = (bookings || []).map((b) => ({
        _id: b.id, id: b.id,
        pnr: b.pnr, status: b.status, totalFare: b.total_fare,
        train: b.trains ? { trainName: b.trains.train_name } : null,
        user:  b.users  ? { name: b.users.name } : null,
        createdAt: b.created_at,
      }));
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
