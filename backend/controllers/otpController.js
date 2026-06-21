const twilio  = require('twilio');
const supabase = require('../config/supabase');

/* In-memory OTP store as fallback when DB table or Twilio is unavailable */
const otpStore = new Map();

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
    const expiresAt = Date.now() + 5 * 60 * 1000;

    /* always store in memory as primary fallback */
    otpStore.set(phone, { code, expiresAt });

    /* try DB storage — silently skip if table doesn't exist */
    try {
      await supabase.from('otps').delete().eq('phone', phone);
      await supabase.from('otps').insert({ phone, code, expires_at: new Date(expiresAt).toISOString() });
    } catch (_) { /* otps table may not exist yet */ }

    /* try SMS via Twilio — fall back to demo mode if not configured */
    let smsSent = false;
    const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
    if (hasTwilio) {
      try {
        await getClient().messages.create({
          body: `Your Smart Railway OTP is: ${code}. Valid for 5 minutes. Do not share this code.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to:   toIntl(phone),
        });
        smsSent = true;
      } catch (smsErr) {
        console.warn('Twilio SMS failed (demo mode active):', smsErr.message);
      }
    }

    res.json({
      success:  true,
      message:  smsSent ? `OTP sent to ${phone}` : 'OTP generated (demo mode)',
      ...(smsSent ? {} : { demoCode: code }),
    });
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

    /* check in-memory store first */
    const mem = otpStore.get(phone);
    if (mem && mem.code === code && Date.now() <= mem.expiresAt) {
      otpStore.delete(phone);
      return res.json({ success: true, message: 'OTP verified' });
    }

    /* try DB store */
    try {
      const { data: otp } = await supabase
        .from('otps')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otp) {
        await supabase.from('otps').update({ used: true }).eq('id', otp.id);
        return res.json({ success: true, message: 'OTP verified' });
      }
    } catch (_) { /* otps table may not exist */ }

    return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Try again.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
