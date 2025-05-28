@echo off
echo Starting setup and running both projects...

REM Install user project dependencies
echo Installing dependencies for user project...
cd user
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing user project dependencies!
    pause
    exit /b 1
)
cd ..

REM Install admin project dependencies
echo Installing dependencies for admin project...
cd admin
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing admin project dependencies!
    pause
    exit /b 1
)
cd ..

REM Setup SQLite database for admin if needed
echo Setting up database for admin project...
cd admin
call npm run setup:sqlite
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Database setup might have issues.
)
cd ..

REM Run user project in a new command window
echo Starting user project...
start cmd /k "cd user && npm start"

REM Run admin project in a new command window
echo Starting admin project...
start cmd /k "cd admin && npm run dev"

REM Wait for servers to start
echo Waiting for servers to start...
ping 127.0.0.1 -n 8 > nul

REM Open user project in browser (port 3003)
echo Opening user project in browser...
start http://localhost:3003

REM Open admin project in browser (port 3000)
echo Opening admin project in browser...
start http://localhost:3000

echo Both projects are now running! 