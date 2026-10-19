#!/bin/bash
# Auto-deployment script for Future Freight / Carryfox
# This script handles automatic deployments on your server

set -e  # Exit on error

echo "=========================================="
echo "Future Freight Auto-Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/Code-Augmented-Systems/AGS/projects/Carryfox"  # Repo folder on the server
BACKUP_DIR="$APP_DIR/backups"
ENV_FILE="$APP_DIR/.env"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup database
backup_database() {
    echo -e "${YELLOW}Backing up database...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker exec carryfox-db-1 pg_dump -U carryfox future_freight > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    echo -e "${GREEN}Database backup completed${NC}"
}

# Function to backup .env file
backup_env() {
    echo -e "${YELLOW}Backing up .env file...${NC}"
    cp "$ENV_FILE" "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}.env backup completed${NC}"
}

# Pull latest code
echo -e "${YELLOW}Pulling latest code from GitHub...${NC}"
cd "$APP_DIR"
git pull origin main || git pull origin master

# Backup current state
backup_database
backup_env

# Stop running services
echo -e "${YELLOW}Stopping current services...${NC}"
docker compose down

# Build and start new services
# (DB schema migrations run automatically — the api service waits for the
# `migrate` one-shot defined in docker-compose.yml.)
echo -e "${YELLOW}Building and starting new services (including DB migrations)...${NC}"
docker compose up -d --build

# Clean up old Docker images (keep last 5)
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker image prune -f --filter "until=24h"

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ All services are running${NC}"
else
    echo -e "${RED}✗ Some services failed to start${NC}"
    docker compose logs
    exit 1
fi

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name ".env.backup.*" -mtime +7 -delete

echo -e "${GREEN}=========================================="
echo -e "Deployment completed successfully!"
echo -e "==========================================${NC}"
