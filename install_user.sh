#!/bin/bash
echo "Starting user project setup..."

# Navigate to user directory
echo "Installing dependencies for user project..."
cd /root/Peony/user

# Install dependencies
if ! npm install; then
    echo "Error: Failed to install user project dependencies!"
    exit 1
fi

echo "User project setup complete!"
echo "To start the user server, run: cd /root/Peony/user && HOST=159.65.206.177 PORT=3003 npm start"
echo "User application will be available at: http://159.65.206.177:3003"
