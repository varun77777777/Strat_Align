#!/bin/bash
# start-dev.sh — Start all 3 services for local development

echo "========================================================"
echo " Starting Strat-Align Developer Environment"
echo "========================================================"

# Trap ctrl-c and kill all processes
trap "kill 0" EXIT

# 1. Start AI microservice
echo "-> Starting Python AI Service on port 8000..."
cd "$(dirname "$0")/../ai-service"
python main.py &
AI_PID=$!

# 2. Start Express backend
echo "-> Starting Node.js Backend on port 5000..."
cd "$(dirname "$0")/../backend"
npm start &
BACKEND_PID=$!

# 3. Start Frontend client
echo "-> Starting React Frontend on port 5173..."
cd "$(dirname "$0")/../frontend"
npm run dev &
FRONTEND_PID=$!

wait
