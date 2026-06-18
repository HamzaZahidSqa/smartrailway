# Live Deployment Guide

## 🚀 Option 1: Frontend on Vercel + Backend on Render.com (Recommended)

### Backend Deployment (Render.com)
1. Create account at [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: smart-railway-backend
   - **Region**: Choose closest to you
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dev`
5. In "Environment", add:
   - Key: `MONGODB_URI`
     Value: Your MongoDB connection string (from MongoDB Atlas or local)
   - Key: `JWT_SECRET`
     Value: A strong random string for JWT signing
   - Key: `PORT`
     Value: `10000` (Render will set this automatically, but good to have)
6. Click "Create Web Service"

### Frontend Deployment (Vercel)
1. Create account at [vercel.com](https://vercel.com)
2. Click "New Project" → Import your GitHub repository
3. Vercel should auto-detect it's a Vite project
4. Configure:
   - **Framework**: Vite (auto-detected)
   - **Root Directory**: `frontend` (if deploying from repo root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In "Environment Variables", add:
   - Key: `VITE_API_BASE_URL`
     Value: `https://your-backend-service.onrender.com` (from your Render backend URL)
6. Click "Deploy"

## 🚀 Option 2: Full-Stack on Render.com (Single Service)

If you prefer to deploy everything on Render.com:

1. Modify backend/server.js to serve frontend build (already done in your code)
2. Add a postbuild script to backend/package.json:
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js",
     "seed": "node utils/seed.js",
     "postinstall": "cd ../frontend && npm install && npm run build"
   }
   ```
3. Deploy backend to Render.com as described above, but:
   - Root Directory: (leave blank for repo root)
   - Build Command: `npm install`
   - Start Command: `npm run start`
4. Render will install backend deps, then run postinstall to build frontend
5. Your backend will serve the built frontend at root URL

## 🔑 Environment Variables Summary

### Backend (Render.com)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartrailway` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-jwt-key-change-in-prod` |
| `PORT` | Port to listen on | `10000` (auto-set by Render) |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://smart-railway-backend.onrender.com` |

## 📝 Important Notes

1. **MongoDB**: You'll need a MongoDB instance. Options:
   - MongoDB Atlas (free tier available)
   - Self-hosted MongoDB
   - Local MongoDB (only for testing, not production)

2. **Development vs Production**:
   - In development: Frontend proxies `/api` to `localhost:5000` via Vite
   - In production: Frontend calls `VITE_API_BASE_URL` directly

3. **CORS**: The backend is configured to accept requests from any origin (`origin: true`). For production, you may want to restrict this to your frontend domain.

4. **Database Seeding**: After deploying backend, you may need to run the seed script:
   ```bash
   # Via Render shell or SSH
   cd backend
   node utils/seed.js
   ```

## 🔧 Troubleshooting

### Frontend can't connect to backend
1. Check `VITE_API_BASE_URL` is set correctly in Vercel
2. Verify backend URL is accessible (try visiting it in browser)
3. Check browser console for CORS errors
4. Ensure backend is running and not crashing

### Backend fails to start
1. Check Render logs for error messages
2. Verify `MONGODB_URI` and `JWT_SECRET` are set
3. Ensure MongoDB instance is accessible from Render's IP range

### Build fails
1. Check that Node.js version is 18+ (specified in engines if needed)
2. Verify all dependencies are in package.json
3. Check for typos in import paths

## 🌐 Access URLs After Deployment

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend-service.onrender.com`
- **API Docs**: `https://your-backend-service.onrender.com/api` (if you add documentation)

## 🔄 Deployment Workflow

1. Push code to GitHub: `git push origin main`
2. Vercel/Renders auto-deploy on push (if configured)
3. Monitor deployment logs in respective dashboards
4. Test the live application
5. For backend-only changes, only Render redeploys
6. For frontend-only changes, only Vercel redeploys