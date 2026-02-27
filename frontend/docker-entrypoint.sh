#!/bin/sh

# Set the default port if PORT is not set (e.g., for local testing)
# Cloud Run will always set PORT.
export PORT=${PORT:-80}

echo "--- Starting Nginx ---"
echo "Substituting \$PORT with: ${PORT}"

# Run envsubst to replace ${PORT} in the template file
# and write the output to the active config file.
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx config generated. Starting Nginx..."
echo "---"

# Start nginx in the foreground
exec nginx -g 'daemon off;'
