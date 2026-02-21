#!/bin/bash
set -e

echo "==> aRMP Sales Intelligence & CRM — Startup"
echo ""

# Install root dependencies
echo "[1/3] Installing root dependencies..."
cd "$(dirname "$0")"
npm install --silent

# Install server dependencies
echo "[2/3] Installing server dependencies..."
cd server
npm install --silent

# Install client dependencies
echo "[3/3] Installing client dependencies..."
cd ../client
npm install --silent

echo ""
echo "Dependencies installed. Starting development servers..."
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo ""
cd ..
npm run dev
