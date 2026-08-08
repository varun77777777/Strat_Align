#!/bin/bash
# deploy.sh — Deploy Strat-Align production environment

echo "========================================================"
echo " Deploying Strat-Align Production Stack"
echo "========================================================"

# Run docker-compose in daemon mode to spin up MongoDB, Backend, and AI Service
if command -v docker-compose &> /dev/null; then
  echo "-> Launching Docker Compose stack..."
  docker-compose up -d --build
  echo "Stack successfully deployed!"
else
  echo "Error: docker-compose command not found."
  echo "Please install Docker Desktop or Docker Engine and run again."
  exit 1
fi
