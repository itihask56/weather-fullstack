# 🔧 Fix Environment Variables on Render

## ❌ **The Problem**

Your app is live but can't access the Weather API key. This means the environment variables aren't being set properly.

## ✅ **Quick Fix - Manual Environment Variables**

### **Step 1: Go to Render Dashboard**

1. Go to https://render.com/dashboard
2. Click on your "weather-dashboard" service
3. Click on "Environment" in the left sidebar

### **Step 2: Add These Environment Variables**

Click "Add Environment Variable" and add each of these:

| Key               | Value                             |
| ----------------- | --------------------------------- |
| `NODE_ENV`        | `production`                      |
| `WEATHER_API_KEY` | `cac2155384844b07bab173545250701` |
| `PORT`            | `10000`                           |
| `DB_PATH`         | `./data/weather.db`               |
| `CACHE_TTL`       | `1800`                            |

### **Step 3: Redeploy**

- After adding all variables, click "Save Changes"
- Render will automatically redeploy your service
- Wait 2-3 minutes for deployment to complete

## 🔍 **Verify the Fix**

### **Test Your App**

1. **Health Check:** `https://your-app.onrender.com/health`
2. **Weather Test:** `https://your-app.onrender.com/api/weather/London`
3. **Frontend:** `https://your-app.onrender.com/`

### **Expected Results**

- ✅ No more API key errors
- ✅ Weather data loads successfully
- ✅ Cities can be added and removed
- ✅ Search functionality works

## 🚨 **Alternative: Push Code Fix**

I've also updated your code to handle environment variables better. You can push these changes:

```bash
git add .
git commit -m "Fix environment variable handling for production"
git push origin main
```

This will:

- Skip .env file loading in production
- Add debug logging to show what's happening
- Provide better error messages

## 🎯 **Why This Happened**

**Issue:** The `render.yaml` file should automatically set environment variables, but sometimes manual setup is more reliable.

**Solution:** Manually setting environment variables in Render dashboard ensures they're properly configured.

## ✅ **Success Indicators**

After the fix, you should see:

- ✅ App loads without errors
- ✅ Weather data displays for cities
- ✅ No "API key" error messages
- ✅ All functionality works

---

**Your Weather Dashboard will be fully functional after this fix! 🌤️**
