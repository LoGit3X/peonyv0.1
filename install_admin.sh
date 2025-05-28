#!/bin/bash
echo "Starting admin project setup..."

# Navigate to admin directory
echo "Installing dependencies for admin project..."
cd /root/Peony/admin

# Install dependencies
if ! npm install; then
    echo "Error: Failed to install admin project dependencies!"
    exit 1
fi

# Setup SQLite database
echo "Setting up database for admin project..."
if ! npm run setup:sqlite; then
    echo "Warning: Database setup might have issues."
fi

echo "Admin project setup complete!"
echo "To start the admin server, run: cd /root/Peony/admin && HOST=159.65.206.177 PORT=3000 npm run dev"
echo "Admin panel will be available at: http://159.65.206.177:3000"
