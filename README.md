# Weather Dashboard - Enterprise-Grade Application

A professional weather dashboard with enterprise-level features including multi-layer caching, enhanced error handling, real-time search, and user-friendly notifications using WeatherAPI.com.

## 🏗️ Architecture

This application follows a modular MVC pattern with enterprise-grade features:

```
weather-dashboard/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/
│   │   │   └── config.js           # Configuration management
│   │   ├── controllers/
│   │   │   └── weatherController.js # Request handling with validation
│   │   ├── middleware/
│   │   │   ├── errorHandler.js     # Enhanced error handling
│   │   │   ├── logger.js           # Request logging
│   │   │   └── rateLimiter.js      # API rate limiting
│   │   ├── models/
│   │   │   └── cityModel.js        # Data models with validation
│   │   ├── routes/
│   │   │   └── weatherRoutes.js    # RESTful route definitions
│   │   ├── services/
│   │   │   ├── weatherService.js   # Weather API integration
│   │   │   ├── cacheService.js     # In-memory caching
│   │   │   └── databaseService.js  # SQLite database operations
│   │   ├── app.js                  # Express app configuration
│   │   └── server.js               # Server entry point
│   ├── data/
│   │   └── weather.db              # SQLite database
│   ├── .env                        # Backend environment variables
│   └── package.json                # Backend dependencies
├── frontend/                   # Modern frontend
│   ├── css/
│   │   └── styles.css              # Enhanced responsive CSS
│   ├── js/
│   │   └── app.js                  # Advanced JavaScript class
│   └── index.html                  # Modern HTML structure
├── IMPLEMENTATION_SUMMARY.md   # Detailed implementation guide
└── README.md                   # This documentation
```

## ✨ Enterprise Features

### 🚀 **Core Features**

- ✅ **Multi-layer Caching** - In-memory + SQLite database caching
- ✅ **Enhanced Error Handling** - User-friendly error messages with suggestions
- ✅ **Real-time City Search** - Autocomplete with API integration
- ✅ **Favorite Cities** - Star/unstar cities with priority display
- ✅ **Periodic Auto-refresh** - Background data updates every 30 minutes
- ✅ **Responsive Design** - Mobile-first with modern UI/UX
- ✅ **API Rate Limiting** - Protection against abuse
- ✅ **Request Retry Logic** - Automatic retry with exponential backoff
- ✅ **Stale Data Fallback** - Serve cached data when API fails

### 🛡️ **Reliability & Performance**

- ✅ **SQLite Database** - Persistent data storage and caching
- ✅ **Connection Pooling** - Efficient database connections
- ✅ **Error Recovery** - Graceful degradation on API failures
- ✅ **Input Validation** - Comprehensive data validation with Joi
- ✅ **CORS Support** - Cross-origin resource sharing
- ✅ **Environment Configuration** - Secure configuration management
- ✅ **API Usage Logging** - Detailed analytics and monitoring

### 🎨 **User Experience**

- ✅ **Smart Notifications** - Context-aware success/error messages
- ✅ **City Name Suggestions** - Auto-correct common misspellings
- ✅ **Loading States** - Visual feedback for all operations
- ✅ **Empty State Handling** - Helpful onboarding for new users
- ✅ **Keyboard Navigation** - Full keyboard accessibility
- ✅ **Mobile Optimization** - Touch-friendly interface

## 🚀 Quick Start

### Prerequisites

- Node.js 14+
- Free API key from [WeatherAPI.com](https://www.weatherapi.com/)

### Installation

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd weather-dashboard
   cd backend && npm install
   ```

2. **Configure environment (backend/.env):**

   ```bash
   WEATHER_API_KEY=your_actual_api_key_here
   PORT=3001
   NODE_ENV=development
   DB_PATH=./data/weather.db
   CACHE_TTL=1800
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX=100
   ```

3. **Start the application:**

   ```bash
   # From backend directory
   npm run dev    # Development with auto-restart
   npm start      # Production mode
   ```

4. **Access the application:**
   ```
   Main App: http://localhost:3001
   Health Check: http://localhost:3001/health
   API Stats: http://localhost:3001/api/stats
   ```

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint     | Description          | Features            |
| ------ | ------------ | -------------------- | ------------------- |
| GET    | `/health`    | Health check         | System status       |
| GET    | `/api/stats` | API usage statistics | Performance metrics |

### City Management

| Method | Endpoint                     | Description       | Features                 |
| ------ | ---------------------------- | ----------------- | ------------------------ |
| GET    | `/api/cities`                | Get user's cities | Sorted by favorites      |
| POST   | `/api/cities`                | Add new city      | Validation + suggestions |
| DELETE | `/api/cities/:city`          | Remove city       | Soft delete              |
| POST   | `/api/cities/:city/favorite` | Toggle favorite   | Priority sorting         |

### Weather Data

| Method | Endpoint                        | Description      | Features                 |
| ------ | ------------------------------- | ---------------- | ------------------------ |
| GET    | `/api/weather/:city`            | Get weather data | 5-day forecast + caching |
| GET    | `/api/weather/:city?fresh=true` | Force fresh data | Bypass cache             |

### Search

| Method | Endpoint                     | Description   | Features               |
| ------ | ---------------------------- | ------------- | ---------------------- |
| GET    | `/api/cities/search?q=query` | Search cities | Real-time autocomplete |

## 🛠️ Development

### Available Scripts

```bash
# Backend (from backend/ directory)
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run tests (placeholder)

# Database operations
npm run db:reset   # Reset database (if implemented)
npm run db:seed    # Seed with sample data (if implemented)
```

### Key Dependencies

**Backend:**

- `express` - Web framework
- `axios` - HTTP client for Weather API
- `sqlite3` - Database
- `node-cache` - In-memory caching
- `joi` - Input validation
- `express-rate-limit` - Rate limiting
- `cors` - Cross-origin support
- `dotenv` - Environment configuration

**Frontend:**

- Vanilla JavaScript (ES6+ classes)
- Modern CSS with Grid/Flexbox
- Responsive design principles

## 🏆 Architecture Benefits

### 🔧 **Technical Excellence**

1. **Separation of Concerns** - Clear MVC architecture
2. **Caching Strategy** - Multi-layer caching for performance
3. **Error Resilience** - Graceful degradation and recovery
4. **Input Validation** - Comprehensive data validation
5. **Rate Limiting** - API protection and fair usage

### 📈 **Scalability**

1. **Modular Design** - Easy to extend and maintain
2. **Database Integration** - Persistent storage ready
3. **Caching Layers** - Performance optimization
4. **API Abstraction** - Easy to switch weather providers
5. **Configuration Management** - Environment-based settings

### 👥 **User Experience**

1. **Responsive Design** - Works on all devices
2. **Real-time Features** - Live search and updates
3. **Error Handling** - User-friendly error messages
4. **Performance** - Fast loading with caching
5. **Accessibility** - Keyboard navigation support

## 🔍 Monitoring & Analytics

The application includes built-in monitoring:

- **API Usage Tracking** - All API calls logged with response times
- **Cache Hit Rates** - Monitor caching effectiveness
- **Error Logging** - Detailed error tracking and analysis
- **Performance Metrics** - Response time monitoring

Access stats at: `http://localhost:3001/api/stats`

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Set up reverse proxy (nginx)
4. Configure SSL/TLS
5. Set up monitoring and logging
6. Configure backup for SQLite database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for enterprise-grade weather monitoring** 🌤️
