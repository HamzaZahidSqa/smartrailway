require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const connectDB = require('./config/db')

const app = express()

connectDB()

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }))
app.use(express.json())

app.use('/api/auth',     require('./routes/auth'))
app.use('/api/trains',   require('./routes/trains'))
app.use('/api/routes',   require('./routes/routeRoutes'))
app.use('/api/coaches',  require('./routes/coaches'))
app.use('/api/seats',    require('./routes/seats'))
app.use('/api/bookings', require('./routes/bookings'))
app.use('/api/tickets',  require('./routes/tickets'))
app.use('/api/admin',    require('./routes/admin'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: err.message || 'Server Error' })
})

module.exports = app
