const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed, phone, role: 'passenger' })
      .select('id, name, email, role')
      .single();
    if (error) throw error;

    const token = signToken(user.id);
    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user.id);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('id').eq('email', req.body.email).maybeSingle();
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

    const token  = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('users').update({ reset_password_token: hashed, reset_password_expire: expire }).eq('id', user.id);
    res.json({ success: true, message: 'Reset token generated', resetToken: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('reset_password_token', hashed)
      .gt('reset_password_expire', new Date().toISOString())
      .maybeSingle();
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    const hashedPw = await bcrypt.hash(req.body.password, 10);
    await supabase.from('users').update({ password: hashedPw, reset_password_token: null, reset_password_expire: null }).eq('id', user.id);

    res.json({ success: true, token: signToken(user.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
