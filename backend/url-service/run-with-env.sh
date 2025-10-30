#!/bin/bash

# Load environment variables from .env file in project root
if [ -f "../../.env" ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' ../../.env | xargs)
else
    echo "Warning: .env file not found, using default values"
fi

# Set default values if not provided
export MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/pebly-database}"
export MONGODB_DATABASE="${MONGODB_DATABASE:-pebly-database}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-your-google-client-id}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-your-google-client-secret}"

echo "Using MongoDB URI: $MONGODB_URI"
echo "Using MongoDB Database: $MONGODB_DATABASE"

# Run the application
mvn spring-boot:run