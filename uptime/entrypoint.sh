#!/bin/sh
set -e

echo ">>> Running migrations..."
python manage.py migrate --noinput

echo ">>> Starting supervisord..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
