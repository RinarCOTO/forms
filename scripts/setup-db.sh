#!/bin/bash

# PostgreSQL Setup Script for RPFAAS Forms Application
# This script automates the database setup process

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}PostgreSQL Database Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed or not in PATH${NC}"
    echo "Please install PostgreSQL first:"
    echo "  brew install postgresql@15"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting it now...${NC}"
    brew services start postgresql@15
    sleep 3
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Get database credentials
echo "Please provide database credentials:"
read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Database name (default: forms_db): " DB_NAME
DB_NAME=${DB_NAME:-forms_db}

read -p "Port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${YELLOW}Creating database: ${DB_NAME}${NC}"

# Create database
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Database may already exist, continuing...${NC}"
}

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Run schema
if [ -f "database/schema.sql" ]; then
    echo -e "${YELLOW}Running schema migrations...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h localhost -d $DB_NAME -f database/schema.sql
    echo -e "${GREEN}✅ Schema created successfully${NC}"
else
    echo -e "${RED}❌ schema.sql not found in database/ folder${NC}"
    exit 1
fi

echo ""

# Create .env.local file
ENV_FILE=".env.local"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"

echo -e "${YELLOW}Creating $ENV_FILE file...${NC}"
cat > $ENV_FILE << EOF
# PostgreSQL Database Connection
DATABASE_URL="$DATABASE_URL"

# Generated on $(date)
EOF

echo -e "${GREEN}✅ $ENV_FILE created${NC}"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h localhost -d $DB_NAME -c "SELECT NOW() as current_time;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Install Node.js dependencies:"
echo "   npm install pg @types/pg"
echo ""
echo "2. Start your development server:"
echo "   npm run dev"
echo ""
echo "3. Your database is ready at:"
echo "   $DATABASE_URL"
echo ""
echo -e "${YELLOW}Note: Make sure to add .env.local to your .gitignore file!${NC}"
