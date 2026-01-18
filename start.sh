#!/bin/bash

# ============================================
# HireScore AI - Development Startup Script
# ============================================
#
# This script starts both the frontend and backend
# development servers for HireScore AI.
#
# Usage: ./start.sh [OPTIONS]
#   --frontend    Start frontend only (port 3002)
#   --backend     Start backend only (port 3001)
#   --install     Force reinstall dependencies
#   --help        Show this help message
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=3002
BACKEND_PORT=3001
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
FRONTEND_ONLY=false
BACKEND_ONLY=false
FORCE_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend)
            BACKEND_ONLY=true
            shift
            ;;
        --install)
            FORCE_INSTALL=true
            shift
            ;;
        --help)
            echo "HireScore AI - Development Startup Script"
            echo ""
            echo "Usage: ./start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --frontend    Start frontend only (port $FRONTEND_PORT)"
            echo "  --backend     Start backend only (port $BACKEND_PORT)"
            echo "  --install     Force reinstall dependencies"
            echo "  --help        Show this help message"
            echo ""
            echo "Without options, both frontend and backend will start."
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║   ██╗  ██╗██╗██████╗ ███████╗███████╗ ██████╗ ██████╗ ███████╗   ║"
echo "║   ██║  ██║██║██╔══██╗██╔════╝██╔════╝██╔════╝██╔═══██╗██╔════╝   ║"
echo "║   ███████║██║██████╔╝█████╗  ███████╗██║     ██║   ██║█████╗     ║"
echo "║   ██╔══██║██║██╔══██╗██╔══╝  ╚════██║██║     ██║   ██║██╔══╝     ║"
echo "║   ██║  ██║██║██║  ██║███████╗███████║╚██████╗╚██████╔╝██║██╗     ║"
echo "║   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝     ║"
echo "║                                                                   ║"
echo "║            AI-Powered CV Screening Platform                       ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd "$PROJECT_DIR"

# ============================================
# Check Prerequisites
# ============================================

echo -e "${BLUE}[1/5]${NC} Checking prerequisites..."

# Check for bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ Bun is not installed${NC}"
    echo ""
    echo "Please install Bun first:"
    echo -e "${YELLOW}  curl -fsSL https://bun.sh/install | bash${NC}"
    echo ""
    exit 1
fi

BUN_VERSION=$(bun --version)
echo -e "${GREEN}✓${NC} Bun v${BUN_VERSION} found"

# Check for Node.js (optional but recommended)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} found"
fi

# ============================================
# Check Environment
# ============================================

echo -e "${BLUE}[2/5]${NC} Checking environment..."

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"

    if [ -f ".env.example" ]; then
        echo "  Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}  ⚠ Please edit .env and add your OPENROUTER_API_KEY${NC}"
        echo ""
        echo "  Get your API key at: https://openrouter.ai/keys"
        echo ""
        read -p "  Press Enter after updating .env, or Ctrl+C to exit..."
    else
        echo -e "${RED}✗ No .env.example found either${NC}"
        exit 1
    fi
fi

# Validate required environment variables
if [ "$BACKEND_ONLY" = true ] || [ "$FRONTEND_ONLY" = false ]; then
    source .env 2>/dev/null || true

    if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "sk-or-v1-your-key-here" ]; then
        echo -e "${RED}✗ OPENROUTER_API_KEY is not configured in .env${NC}"
        echo ""
        echo "  Please add your API key to .env:"
        echo -e "${YELLOW}  OPENROUTER_API_KEY=sk-or-v1-your-actual-key${NC}"
        echo ""
        echo "  Get your API key at: https://openrouter.ai/keys"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Environment variables configured"
fi

# ============================================
# Install Dependencies
# ============================================

echo -e "${BLUE}[3/5]${NC} Checking dependencies..."

if [ "$FORCE_INSTALL" = true ] || [ ! -d "node_modules" ]; then
    echo "  Installing dependencies with Bun..."
    bun install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# ============================================
# Kill existing processes on ports
# ============================================

echo -e "${BLUE}[4/5]${NC} Checking for port conflicts..."

kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}  Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

if [ "$BACKEND_ONLY" = false ]; then
    kill_port $FRONTEND_PORT
fi

if [ "$FRONTEND_ONLY" = false ]; then
    kill_port $BACKEND_PORT
fi

echo -e "${GREEN}✓${NC} Ports are available"

# ============================================
# Start Servers
# ============================================

echo -e "${BLUE}[5/5]${NC} Starting development servers..."
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

if [ "$FRONTEND_ONLY" = true ]; then
    # Frontend only
    echo -e "${CYAN}Starting Frontend (Vite + React)...${NC}"
    echo -e "  URL: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
    echo ""
    bun run dev:frontend

elif [ "$BACKEND_ONLY" = true ]; then
    # Backend only
    echo -e "${CYAN}Starting Backend (Express + Bun)...${NC}"
    echo -e "  API: ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
    echo ""
    bun run dev:backend

else
    # Both servers
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo -e "║  ${CYAN}Frontend${NC}:  http://localhost:${FRONTEND_PORT}   (React + Vite)             ║"
    echo -e "║  ${CYAN}Backend${NC}:   http://localhost:${BACKEND_PORT}   (Express + Bun)            ║"
    echo -e "║  ${CYAN}API Docs${NC}:  http://localhost:${BACKEND_PORT}/api/health                   ║"
    echo "╠═══════════════════════════════════════════════════════════════════╣"
    echo "║  Press Ctrl+C to stop all servers                                 ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""

    # Start both using concurrently (from package.json)
    bun run dev
fi
