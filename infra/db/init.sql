-- Create test database alongside the main one
SELECT 'CREATE DATABASE dyventory_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dyventory_test')\gexec