const supabase = require('./supabase');

const connectDB = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (err) {
    console.error(`Supabase connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
