#!/bin/bash
# build.sh — Build all layers for production deployment

echo "========================================================"
echo " Building Strat-Align Services for Production"
echo "========================================================"

# 1. Install & build frontend
echo "-> Building React Frontend..."
cd "$(dirname "$0")/../frontend"
npm install
npm run build

# 2. Install backend dependencies
echo "-> Checking Backend dependencies..."
cd "../backend"
npm install --production

# 3. Check Python requirements
echo "-> Checking AI Service requirements..."
cd "../ai-service"
pip install -r requirements.txt

echo "========================================================"
echo " Build successful! All artifacts prepared."
echo "========================================================"
