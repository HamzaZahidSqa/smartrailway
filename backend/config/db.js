const supabase = require('./supabase');

const connectDB = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (err) {
    // Log warning only — do not exit in serverless environments
    console.warn(`Supabase connection warning: ${err.message}`);
  }
};

module.exports = connectDB;
