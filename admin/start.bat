@echo off
echo Checking prerequisites for Peony Cafe System...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
    set NODE_MAJOR=%%a
)
if "%NODE_MAJOR:~1%" LSS "18" (
    echo Node.js version 18 or higher is required!
    echo Current version:
    node -v
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed!
    pause
    exit /b 1
)

REM Check if Chrome is installed
where chrome >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Chrome is not found in PATH. Will try to use the default browser instead.
    set BROWSER_CMD=start http://localhost:3000
) else (
    echo Chrome found, will use it to open the application.
    set BROWSER_CMD=start chrome http://localhost:3000
)

REM Create data directory if it doesn't exist
if not exist "data" (
    echo Creating data directory...
    mkdir data
)

echo Checking and installing dependencies...
call npm install

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

REM Skip database migrations to avoid data loss
REM call npm run db:push
echo Skipping database migrations to preserve existing data

echo Starting the development server on port 3000...
echo The application will be opened in your browser shortly...

REM Start a temporary batch file to wait and then open browser
echo @echo off > temp_browser.bat
echo timeout /t 5 /nobreak > temp_browser.bat
echo %BROWSER_CMD% >> temp_browser.bat
echo del temp_browser.bat >> temp_browser.bat
start /min temp_browser.bat

REM Start the development server in the foreground
npm run dev