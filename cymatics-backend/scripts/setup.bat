@echo off
echo 🎬 Setting up Cymatics Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm version:
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your configuration before starting the server
) else (
    echo ✅ .env file already exists
)

REM Generate Prisma client
echo 🗄️  Generating Prisma client...
npm run db:generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated successfully

REM Create uploads directory
if not exist "uploads" (
    echo 📁 Creating uploads directory...
    mkdir uploads
    echo ✅ Uploads directory created
)

REM Create logs directory
if not exist "logs" (
    echo 📁 Creating logs directory...
    mkdir logs
    echo ✅ Logs directory created
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update your .env file with the correct database URL and other settings
echo 2. Make sure PostgreSQL is running on port 5433
echo 3. Run 'npm run db:push' to create the database schema
echo 4. Run 'npm run db:seed' to populate with sample data (optional)
echo 5. Run 'npm run dev' to start the development server
echo.
echo 🔗 Useful commands:
echo   npm run dev          - Start development server
echo   npm run build        - Build for production
echo   npm run start        - Start production server
echo   npm run db:studio    - Open Prisma Studio
echo   npm test             - Run tests
echo.
echo 📚 Documentation: http://localhost:3000/api
echo 🏥 Health check: http://localhost:3000/health

pause
