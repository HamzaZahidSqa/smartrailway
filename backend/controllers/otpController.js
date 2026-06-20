const twilio  = require('twilio');
const supabase = require('../config/supabase');

const getClient = () => twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/* normalise Pakistani number → +92XXXXXXXXXX */
function toIntl(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) return '+' + digits;
  if (digits.startsWith('0'))  return '+92' + digits.slice(1);
  return '+92' + digits;
}

/* POST /api/auth/send-otp */
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    /* delete any old OTPs for this number */
    await supabase.from('otps').delete().eq('phone', phone);

    /* store new OTP */
    const { error: dbErr } = await supabase.from('otps').insert({ phone, code, expires_at: expiresAt });
    if (dbErr) throw dbErr;

    /* send SMS */
    await getClient().messages.create({
      body: `Your Smart Railway OTP is: ${code}. Valid for 5 minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   toIntl(phone),
    });

    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (err) {
    console.error('sendOtp error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/auth/verify-otp */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ success: false, message: 'Phone and code required' });

    const { data: otp } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!otp) return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Try again.' });

    /* mark used */
    await supabase.from('otps').update({ used: true }).eq('id', otp.id);

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
