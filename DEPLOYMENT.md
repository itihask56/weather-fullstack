# Weather Dashboard - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Direct Node.js Deployment

1. **Prepare for production:**

   ```bash
   cd backend
   npm run build
   ```

2. **Start the application:**
   ```bash
   npm start
   ```

### Option 2: Using Deployment Script

1. **Make sure you have your API key in backend/.env**
2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

### Option 3: Docker Deployment

1. **Build and run with Docker:**

   ```bash
   docker build -t weather-dashboard .
   docker run -p 3001:3001 -e WEATHER_API_KEY=your_key_here weather-dashboard
   ```

2. **Or use Docker Compose:**
   ```bash
   # Set your API key in .env file first
   echo "WEATHER_API_KEY=your_key_here" > .env
   docker-compose up -d
   ```

## 🔧 Production Configuration

### Environment Variables (.env)

```bash
WEATHER_API_KEY=your_weatherapi_key_here
PORT=3001
NODE_ENV=production
DB_PATH=./data/weather.db
CACHE_TTL=1800
RATE_LIMIT_MAX=100
```

### System Requirements

- Node.js 14+
- 512MB RAM minimum
- 1GB disk space
- Internet connection for Weather API

## 🌐 Cloud Deployment

### Heroku

```bash
# Install Heroku CLI, then:
heroku create your-weather-app
heroku config:set WEATHER_API_KEY=your_key_here
git push heroku main
```

### Railway

```bash
# Connect your GitHub repo to Railway
# Set WEATHER_API_KEY in environment variables
# Deploy automatically on push
```

### DigitalOcean App Platform

```bash
# Create new app from GitHub
# Set environment variables
# Deploy with one click
```

## 🔍 Health Monitoring

- **Health Check:** `GET /health`
- **API Stats:** `GET /api/stats`
- **Database:** SQLite with automatic initialization

## 🛡️ Security Features

- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling without data leaks
- ✅ Environment-based configuration

## 📊 Performance Features

- ✅ Multi-layer caching (memory + database)
- ✅ Request retry logic
- ✅ Stale data fallback
- ✅ Connection pooling
- ✅ Optimized database queries

Your Weather Dashboard is production-ready! 🌤️
