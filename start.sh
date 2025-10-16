#!/bin/bash

echo "========================================"
echo "BCSME Membership System"
echo "========================================"
echo ""
echo "Installing dependencies..."
pip3 install -r requirements.txt
echo ""
echo "Starting application..."
echo ""
echo "Open your browser and go to: http://localhost:5000"
echo ""
echo "To setup admin account, go to: http://localhost:5000/setup"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 app.py
