# Run SolnAI System Monitoring in Production Without Docker

> [!WARNING]
> This method of deployment is **not recommended** for production environments. We strongly recommend using our Docker-based deployment for ease of updates, security, and stability.
> You are fully responsible for securing your deployment and data in this mode.
> This guide is provided for specialized environments where containerization is not possible.

This document outlines the process for running SolnAI System Monitoring platform directly on a host without containerization.

## Minimum Requirements

> [!TIP]
> For optimal performance, we recommend at least 4GB of RAM for monitoring a small to medium infrastructure (10-20 servers).
> Disk storage requirements scale based on your retention period and the number of systems being monitored.
> For production environments, we recommend at least 20GB of dedicated storage.

- NodeJS v18+
- Yarn
- Optional: InfluxDB or another time-series database for metric storage
- Optional: Redis for distributed deployments

## Getting Started

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/SolnAI/system_monitoring.git
   ```

2. Install dependencies:
   ```bash
   cd system_monitoring
   yarn setup
   ```

3. Create environment configuration files:
   ```bash
   cp server/.env.example server/.env
   cp collector/.env.example collector/.env
   ```

4. Configure the minimal required environment variables in `server/.env`:
   ```
   STORAGE_DIR="/your/absolute/path/to/server/storage"
   COLLECTOR_API_KEY="your-secure-api-key-for-collector-auth"
   METRICS_RETENTION_DAYS=30
   ```

5. Configure collector settings in `collector/.env`:
   ```
   SERVER_URL="http://localhost:3001"
   COLLECTOR_API_KEY="your-secure-api-key-for-collector-auth"
   COLLECTION_INTERVAL=60
   ```

6. Configure the frontend API endpoint in `frontend/.env`:
   ```
   # Use localhost during development
   # VITE_API_BASE='http://localhost:3001/api'
   
   # Use this for production deployment
   VITE_API_BASE='/api'
   ```

## Database Setup

SolnAI uses a relational database for configuration and a time-series database for metrics storage:

1. Set up the relational database:
   ```bash
   cd server
   npx prisma generate --schema=./prisma/schema.prisma
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```

2. If using an external time-series database (recommended for production), configure the connection in `server/.env`:
   ```
   # For InfluxDB example
   TIMESERIES_DB_TYPE=influxdb
   INFLUXDB_URL=http://localhost:8086
   INFLUXDB_TOKEN=your-influxdb-token
   INFLUXDB_ORG=your-org
   INFLUXDB_BUCKET=solnai-metrics
   ```

## Building and Deploying

1. Build the frontend application:
   ```bash
   cd frontend
   yarn build
   ```

2. Copy the frontend build to the server's public directory:
   ```bash
   mkdir -p ../server/public
   cp -R dist/* ../server/public/
   ```

3. Start the main server:
   ```bash
   cd ../server
   NODE_ENV=production node index.js &
   ```

4. Start the collector service:
   ```bash
   cd ../collector
   NODE_ENV=production node index.js &
   ```

SolnAI should now be running on `http://localhost:3001`!

## Deploying Remote Collectors

For monitoring remote systems, you'll need to deploy collectors on each target system:

1. Clone the repository on the target system or copy just the collector directory
2. Configure the collector's `.env` file:
   ```
   SERVER_URL="https://your-solnai-server-url"
   COLLECTOR_API_KEY="your-secure-api-key-for-collector-auth"
   COLLECTION_INTERVAL=60
   SYSTEM_NAME="unique-system-identifier"
   ```

3. Install dependencies and start the collector:
   ```bash
   cd collector
   yarn
   NODE_ENV=production node index.js &
   ```

## Updating SolnAI

To update SolnAI with future releases:

1. Stop all running processes:
   ```bash
   pkill -f "node.*index.js"
   ```

2. Pull the latest code:
   ```bash
   git pull origin main
   ```

3. Update dependencies:
   ```bash
   yarn setup
   ```

4. Rebuild and redeploy following steps in the "Building and Deploying" section above

## Example Update Script

```bash
#!/bin/bash

SOLNAI_HOME="$HOME/system_monitoring"

cd $SOLNAI_HOME
git checkout .
git pull origin main
echo "Updated to commit $(git log -1 --pretty=format:"%h" | tail -n 1)"

echo "Backing up current configuration..."
cp server/.env server/.env.backup
cp collector/.env collector/.env.backup

echo "Rebuilding Frontend"
cd $SOLNAI_HOME/frontend && yarn && yarn build

echo "Copying to Server Public"
rm -rf $SOLNAI_HOME/server/public
mkdir -p $SOLNAI_HOME/server/public
cp -r $SOLNAI_HOME/frontend/dist/* $SOLNAI_HOME/server/public/

echo "Stopping all SolnAI processes"
pkill -f "node.*index.js"

echo "Installing collector dependencies"
cd $SOLNAI_HOME/collector && yarn

echo "Installing server dependencies & running migrations"
cd $SOLNAI_HOME/server && yarn
cd $SOLNAI_HOME/server && npx prisma migrate deploy --schema=./prisma/schema.prisma
cd $SOLNAI_HOME/server && npx prisma generate

echo "Preparing log files"
mkdir -p $SOLNAI_HOME/logs
truncate -s 0 $SOLNAI_HOME/logs/server.log
truncate -s 0 $SOLNAI_HOME/logs/collector.log

echo "Starting SolnAI services"
cd $SOLNAI_HOME/server
(NODE_ENV=production node index.js) &> $SOLNAI_HOME/logs/server.log &

cd $SOLNAI_HOME/collector
(NODE_ENV=production node index.js) &> $SOLNAI_HOME/logs/collector.log &

echo "SolnAI services started. Check logs for status."
```

## Setting Up as System Services

For better reliability, set up the SolnAI components as system services:

### Server Service (systemd)

Create a file at `/etc/systemd/system/solnai-server.service`:

```ini
[Unit]
Description=SolnAI Monitoring Server
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/system_monitoring/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Collector Service (systemd)

Create a file at `/etc/systemd/system/solnai-collector.service`:

```ini
[Unit]
Description=SolnAI Monitoring Collector
After=network.target solnai-server.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/system_monitoring/collector
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the services:

```bash
sudo systemctl enable solnai-server.service
sudo systemctl enable solnai-collector.service
sudo systemctl start solnai-server.service
sudo systemctl start solnai-collector.service
```