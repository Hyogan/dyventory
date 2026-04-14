#!/bin/sh
set -e

# Create the storage symlink if it doesn't exist
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link --quiet || true
fi

exec "$@"
