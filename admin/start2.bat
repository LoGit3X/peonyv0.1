@echo off
echo Starting Peony Cafe System...

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Dependencies not found. Please run 'npm install' first.
    pause
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist "data" (
    echo Creating data directory...
    mkdir data
)

REM Check if .env file exists
if not exist .env (
    echo Creating default .env file...
    echo DATABASE_URL=sqlite:./data/local.db> .env
    echo SESSION_SECRET=your-secret-key>> .env
    echo PORT=3000>> .env
)

REM Setup database if not exists
if not exist "data\local.db" (
    echo Setting up local database...
    call npm run setup
)

echo Starting the development server on port 3000...
echo Application will open in Chrome shortly...

REM Start Chrome in a new tab after a brief delay
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-tab "http://localhost:3000"

REM Start the development server
call npm run dev 