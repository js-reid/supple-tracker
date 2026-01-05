#!/bin/sh
set -e

# Ensure the data directory exists and has correct permissions
mkdir -p /app/data
chown -R node:node /app/data

# Switch to node user and run the application
exec su-exec node node server.js
