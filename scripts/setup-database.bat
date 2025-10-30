@echo off
REM Windows Batch Script for MongoDB Team Collaboration Setup

echo 🚀 Starting MongoDB Database Setup for Team Collaboration...

REM Check if MongoDB is installed
where mongosh >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB Shell (mongosh) not found. Please install MongoDB.
    echo Download from: https://www.mongodb.com/try/download/shell
    pause
    exit /b 1
)

REM Set default values if environment variables are not set
if "%MONGODB_URI%"=="" set MONGODB_URI=mongodb://localhost:27017
if "%MONGODB_DATABASE%"=="" set MONGODB_DATABASE=pebly

echo 📊 Using MongoDB URI: %MONGODB_URI%
echo 📊 Using Database: %MONGODB_DATABASE%

echo.
echo 🔍 Testing MongoDB connection...
mongosh "%MONGODB_URI%" --eval "db.adminCommand('ping')" >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to MongoDB at %MONGODB_URI%
    echo Please check your MongoDB connection and try again.
    pause
    exit /b 1
)
echo ✅ MongoDB connection successful

echo.
echo 🏗️ Setting up database with team collaboration support...
mongosh "%MONGODB_URI%/%MONGODB_DATABASE%" mongodb-setup.js
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo ✅ Database setup completed successfully!
echo.
echo 📊 Next steps:
echo   1. Update your .env file with MONGODB_URI=%MONGODB_URI%
echo   2. Start your Spring Boot application
echo   3. Test team collaboration features
echo.
echo 🎉 Team collaboration is ready!
pause