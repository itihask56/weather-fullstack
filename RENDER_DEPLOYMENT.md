# 🚀 Deploy Weather Dashboard on Render

## Step-by-Step Render Deployment Guide

### **Prerequisites**

- ✅ GitHub account
- ✅ Your weather dashboard code pushed to GitHub
- ✅ Render account (free at render.com)

### **Step 1: Prepare Your Repository**

Your project is already configured for Render! The `render.yaml` file has been created with optimal settings.

### **Step 2: Deploy on Render**

1. **Go to Render Dashboard**

   - Visit: https://render.com
   - Sign up/Login with your GitHub account

2. **Create New Web Service**

   - Click "New +" button
   - Select "Web Service"
   - Choose "Build and deploy from a Git repository"

3. **Connect Repository**

   - Select your weather dashboard repository
   - Click "Connect"

4. **Configure Service** (Auto-filled from render.yaml)

   - **Name:** `weather-dashboard`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`

5. **Environment Variables** (Auto-configured)

   - `NODE_ENV` = `production`
   - `WEATHER_API_KEY` = `cac2155384844b07bab173545250701`
   - `PORT` = `10000` (Render's default)

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-3 minutes)

### **Step 3: Verify Deployment**

Once deployed, Render will provide you with a URL like:
`https://weather-dashboard-xxxx.onrender.com`

**Test these endpoints:**

- **Main App:** `https://your-app.onrender.com/`
- **Health Check:** `https://your-app.onrender.com/health`
- **API Test:** `https://your-app.onrender.com/api/weather/London`

### **Step 4: Custom Domain (Optional)**

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Configure DNS records as shown

## 🔧 **Render-Specific Optimizations**

### **Auto-Deploy on Git Push**

- Every push to your main branch will trigger automatic deployment
- Perfect for continuous deployment

### **Free Tier Limitations**

- ✅ 750 hours/month (enough for personal projects)
- ✅ Automatic sleep after 15 minutes of inactivity
- ✅ Cold start delay (~30 seconds when waking up)

### **Monitoring**

- Built-in logs and metrics
- Health check monitoring
- Automatic restarts on failures

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

1. **Build Fails**

   ```bash
   # Check build logs in Render dashboard
   # Ensure package.json is in backend/ directory
   ```

2. **App Won't Start**

   ```bash
   # Verify start command: cd backend && npm start
   # Check environment variables are set
   ```

3. **Database Issues**

   ```bash
   # SQLite database will be created automatically
   # Data persists between deployments
   ```

4. **API Key Issues**
   ```bash
   # Verify WEATHER_API_KEY is set in environment variables
   # Test API key at weatherapi.com
   ```

## 📊 **Expected Performance**

- **Cold Start:** ~30 seconds (free tier)
- **Warm Response:** <500ms
- **Uptime:** 99.9% (paid tiers)
- **SSL:** Automatic HTTPS

## 🎉 **Post-Deployment**

Your Weather Dashboard will be live with:

- ✅ Real-time weather data
- ✅ Multi-city support
- ✅ Responsive design
- ✅ Caching for performance
- ✅ Error handling
- ✅ Automatic HTTPS

**Share your live app:** `https://your-app.onrender.com`

## 🔄 **Updates**

To update your deployed app:

1. Make changes to your code
2. Push to GitHub
3. Render automatically redeploys
4. Check deployment logs for any issues

**Your Weather Dashboard is now live on Render! 🌤️**
