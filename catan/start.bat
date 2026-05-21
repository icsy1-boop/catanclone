@echo off
echo Starting Catan servers...
echo Server: http://localhost:3001
echo Client: http://localhost:5173
echo.
echo Share http://localhost:5173 with players on your network
echo (use your local IP address instead of localhost for remote players)
echo.
npx concurrently "npm run dev --workspace=server" "npm run dev --workspace=client"
