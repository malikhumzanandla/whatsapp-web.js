FROM node:18-bullseye-slim

# Install required packages 
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    xvfb \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-liberation \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the project files
COPY . .

# Create directories with appropriate permissions
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache /tmp/.X11-unix \
    && chmod -R 777 /app/.wwebjs_auth /app/.wwebjs_cache /tmp/.X11-unix

# Create startup script
RUN echo '#!/bin/bash\n\
# Cleanup any existing X lock files\n\
rm -f /tmp/.X*-lock /tmp/.X11-unix/X* 2>/dev/null || true\n\
# Start virtual display\n\
Xvfb :99 -screen 0 1280x800x24 -ac &\n\
# Wait for Xvfb\n\
sleep 2\n\
export DISPLAY=:99\n\
# Start application\n\
exec node server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Run with virtual display
CMD ["/app/start.sh"]