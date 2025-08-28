#!/bin/bash

# Weather Dashboard Monitoring Script
echo "🔍 Weather Dashboard Health Monitor"
echo "=================================="

# Configuration
HOST=${1:-localhost}
PORT=${2:-3001}
BASE_URL="http://$HOST:$PORT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -s -f "$BASE_URL$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local endpoint=$1
    local description=$2
    local max_time=${3:-2}
    
    echo -n "Checking $description response time... "
    
    local response_time=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL$endpoint")
    local time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        echo -e "${GREEN}✅ ${time_ms}ms${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${time_ms}ms (slow)${NC}"
        return 1
    fi
}

# Health checks
echo ""
echo "🏥 Health Checks:"
check_endpoint "/health" "Health endpoint"
check_endpoint "/api/cities" "Cities API"
check_endpoint "/api/weather/London" "Weather API"
check_endpoint "/api/cities/search?q=New" "Search API"

echo ""
echo "⏱️  Performance Checks:"
check_response_time "/health" "Health endpoint" 1
check_response_time "/api/weather/London" "Weather API" 3
check_response_time "/api/cities/search?q=London" "Search API" 2

echo ""
echo "📊 System Stats:"
if command -v curl &> /dev/null; then
    echo -n "API Stats: "
    if stats=$(curl -s "$BASE_URL/api/stats" 2>/dev/null); then
        echo -e "${GREEN}Available${NC}"
        echo "$stats" | jq '.' 2>/dev/null || echo "$stats"
    else
        echo -e "${RED}Unavailable${NC}"
    fi
else
    echo "curl not available for detailed stats"
fi

echo ""
echo "🔍 Monitor complete!"
echo "Access your app at: $BASE_URL"