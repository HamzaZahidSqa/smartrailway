# Smart Railway Reservation System

Full-stack MERN application for train ticket booking.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017`)

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run seed      # Seed demo data
npm run dev       # Start on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Start on port 5173
```

### Demo Credentials
| Role      | Email                  | Password   |
|-----------|------------------------|------------|
| Admin     | admin@railway.com      | Admin@123  |
| Passenger | john@example.com       | User@123   |

## Features

### Passenger
- Search trains by city, date, passengers
- Interactive seat map (green/red/blue)
- Multi-step booking flow
- Passenger details & ID proof
- Ticket PDF view & print
- PNR status check
- Cancel bookings with refund
- Dashboard with trip history

### Admin
- Dashboard with stats (revenue, bookings, trains)
- Add/Edit/Delete trains
- Manage coaches (Economy, Sleeper, Business, Executive)
- View all bookings with filters
- Monthly revenue, popular routes, daily reports

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`
- `POST /api/auth/forgot-password`

### Trains
- `GET  /api/trains/search?source=&destination=&date=`
- `GET  /api/trains/all` (admin)
- `POST /api/trains` (admin)
- `PUT  /api/trains/:id` (admin)
- `DELETE /api/trains/:id` (admin)

### Coaches & Seats
- `GET  /api/coaches/train/:trainId`
- `POST /api/coaches` (admin)
- `GET  /api/seats?coachId=&date=`

### Bookings
- `POST /api/bookings`
- `GET  /api/bookings/my`
- `GET  /api/bookings/:id`
- `PUT  /api/bookings/:id/cancel`
- `GET  /api/bookings/all` (admin)

### Tickets
- `GET  /api/tickets/booking/:bookingId`
- `GET  /api/tickets/pnr/:pnr`

### Admin
- `GET  /api/admin/dashboard`
- `GET  /api/admin/reports?type=monthly|routes|daily`

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **Auth**: JWT Bearer tokens, bcryptjs hashing
- **UI**: react-hot-toast, react-icons, date-fns
