# Redeploying SolnAI with Enhanced Agent Features

This guide explains how to redeploy an existing SolnAI installation to include the new enhanced agent features.

## Step 1: Backup Your Data

Before proceeding, back up your existing data:

```bash
# Create a backup directory
mkdir -p ~/solnai-backup

# Backup your existing storage
cp -r /path/to/your/solnai/storage ~/solnai-backup/

# Backup your environment configuration
cp /path/to/your/solnai/.env ~/solnai-backup/
```

## Step 2: Update Your Repository

Pull the latest changes from the repository:

```bash
cd /path/to/Soln-Agents
git pull origin master
```

## Step 3: Configure Environment Variables

Copy the example environment file and update it with your settings:

```bash
cd docker-deployment
cp .env.example .env
```

Edit the `.env` file to:
- Keep your existing credentials (JWT_SECRET, AUTH_TOKEN, API keys)
- Add the new paths for storage and agents directories
- Configure the new browser tools and CrewAI service options

## Step 4: Run the Deployment Script

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh start
```

## Step 5: Verify the Deployment

Check that all services are running:

```bash
./deploy.sh status
```

You should see the following services:
- solnai (main application)
- browser-tools-mcp
- browser-tools-server
- crewai-service

## Step 6: Access the Enhanced Features

Access the application at http://localhost:3001 and explore the new agent features:

1. Navigate to the agents section
2. Try creating a new agent session
3. Check the agent health indicators
4. Export conversation history
5. View agent metrics

## Troubleshooting

If you encounter issues:

1. Check the logs:
   ```bash
   ./deploy.sh logs
   ```

2. Restart the services:
   ```bash
   ./deploy.sh restart
   ```

3. For persistent issues, try stopping and rebuilding:
   ```bash
   ./deploy.sh stop
   docker-compose build --no-cache
   ./deploy.sh start
   ```

## Rolling Back

If needed, you can roll back to your previous setup:

1. Stop the new services:
   ```bash
   ./deploy.sh stop
   ```

2. Restore your backup data and return to your previous deployment method.