#!/bin/bash
set -e

echo "Starting backend initialization..."

echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 0.5
done
echo "Database is ready!"

echo "Initializing database tables..."
python -m migrations.init_db

echo "Creating default admin user..."
python -m migrations.create_admin admin@example.com admin123

echo "Creating test user..."
python -m migrations.create_admin test@test.com test123

echo "Initialization complete!"
echo "================================"
echo "Admin credentials: admin@example.com / admin123"
echo "Test credentials:  test@test.com / test123"
echo "================================"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
