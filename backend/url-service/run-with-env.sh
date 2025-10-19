#!/bin/bash

# Load environment variables from .env file
export MONGODB_URI="mongodb+srv://username:password@cluster0.mongodb.net/pebly-database?retryWrites=true&w=majority"
export MONGODB_DATABASE="pebly-database"
export FRONTEND_URL="http://localhost:3000"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Run the application
mvn spring-boot:run