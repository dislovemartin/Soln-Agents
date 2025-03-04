# SolnAI Agent Deployment Guide

This guide provides detailed instructions for deploying SolnAI agents in various environments, from local development to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)
  - [AWS](#aws)
  - [Google Cloud](#google-cloud)
  - [Azure](#azure)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying any SolnAI agent, ensure you have:

- Docker installed (for containerized deployments)
- Kubernetes CLI (kubectl) installed (for Kubernetes deployments)
- Access to a Supabase instance (for database storage)
- API keys for any external services used by the agent
- Git for version control

## Local Deployment

For local development and testing, you can run agents directly:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/SolnAI-agents.git
   cd SolnAI-agents/your-agent-directory
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the agent:
   ```bash
   python main.py
   ```

The agent will be available at `http://localhost:8001` (or the port specified in your .env file).

## Docker Deployment

For more isolated and reproducible deployments, use Docker:

1. Build the Docker image:
   ```bash
   docker build -t solnai/your-agent-name:latest .
   ```

2. Run the container:
   ```bash
   docker run -p 8001:8001 --env-file .env solnai/your-agent-name:latest
   ```

For production, you might want to use Docker Compose for managing multiple containers:

```yaml
# docker-compose.yml
version: '3'
services:
  your-agent:
    build: .
    ports:
      - "8001:8001"
    env_file:
      - .env
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

## Kubernetes Deployment

For scalable, production-grade deployments, use Kubernetes:

1. Create a Kubernetes deployment file:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-agent
  labels:
    app: your-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: your-agent
  template:
    metadata:
      labels:
        app: your-agent
    spec:
      containers:
      - name: your-agent
        image: solnai/your-agent-name:latest
        ports:
        - containerPort: 8001
        env:
        - name: API_BEARER_TOKEN
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: api-bearer-token
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: supabase-url
        - name: SUPABASE_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: supabase-key
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: your-agent
spec:
  selector:
    app: your-agent
  ports:
  - port: 80
    targetPort: 8001
  type: ClusterIP
```

2. Create a secret for sensitive information:
```bash
kubectl create secret generic agent-secrets \
  --from-literal=api-bearer-token=your_token_here \
  --from-literal=supabase-url=your_supabase_url \
  --from-literal=supabase-key=your_supabase_key
```

3. Apply the deployment:
```bash
kubectl apply -f deployment.yaml
```

4. (Optional) Create an Ingress for external access:
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: your-agent-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  rules:
  - host: your-agent.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: your-agent
            port:
              number: 80
  tls:
  - hosts:
    - your-agent.example.com
    secretName: your-agent-tls
```

Apply with:
```bash
kubectl apply -f ingress.yaml
```

## Cloud Deployment

### AWS

To deploy on AWS, you can use:

1. **Amazon ECS (Elastic Container Service)**:
   - Create a task definition for your container
   - Set up an ECS service with the desired number of tasks
   - Use an Application Load Balancer for routing traffic

2. **Amazon EKS (Elastic Kubernetes Service)**:
   - Create an EKS cluster
   - Apply your Kubernetes deployment files
   - Use AWS ALB Ingress Controller for routing traffic

3. **AWS Lambda with Container Images**:
   - Package your agent as a container image
   - Deploy to Lambda with container image support
   - Set up API Gateway for HTTP endpoints

Example AWS CLI commands for ECS:
```bash
# Create a task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create a service
aws ecs create-service --cluster your-cluster --service-name your-agent-service --task-definition your-agent:1 --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/your-target-group/1234567890,containerName=your-agent,containerPort=8001"
```

### Google Cloud

To deploy on Google Cloud, you can use:

1. **Google Kubernetes Engine (GKE)**:
   - Create a GKE cluster
   - Apply your Kubernetes deployment files
   - Set up an Ingress for external access

2. **Cloud Run**:
   - Build and push your container to Google Container Registry
   - Deploy to Cloud Run with appropriate memory and CPU settings

Example gcloud commands for Cloud Run:
```bash
# Build and push the container
gcloud builds submit --tag gcr.io/your-project/your-agent

# Deploy to Cloud Run
gcloud run deploy your-agent --image gcr.io/your-project/your-agent --platform managed --region us-central1 --allow-unauthenticated --set-env-vars="API_BEARER_TOKEN=your_token,SUPABASE_URL=your_url,SUPABASE_KEY=your_key"
```

### Azure

To deploy on Azure, you can use:

1. **Azure Kubernetes Service (AKS)**:
   - Create an AKS cluster
   - Apply your Kubernetes deployment files
   - Set up an Ingress for external access

2. **Azure Container Instances**:
   - Deploy your container directly to ACI
   - Set up environment variables for configuration

3. **Azure App Service**:
   - Deploy your container to App Service
   - Configure environment variables in the App Service settings

Example Azure CLI commands for ACI:
```bash
# Create a resource group
az group create --name your-resource-group --location eastus

# Create a container instance
az container create --resource-group your-resource-group --name your-agent --image solnai/your-agent-name:latest --dns-name-label your-agent --ports 8001 --environment-variables API_BEARER_TOKEN=your_token SUPABASE_URL=your_url SUPABASE_KEY=your_key
```

## Environment Variables

All SolnAI agents require certain environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `API_BEARER_TOKEN` | Authentication token for API access | Yes |
| `SUPABASE_URL` | URL of your Supabase instance | Yes |
| `SUPABASE_KEY` | API key for Supabase access | Yes |
| `PORT` | Port to run the agent on (default: 8001) | No |
| `LOG_LEVEL` | Logging level (default: INFO) | No |

Agent-specific variables may also be required. Check the agent's README.md for details.

## Database Setup

SolnAI agents use Supabase for storing conversation history. Set up your database with:

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create a `messages` table with the following SQL:
```sql
CREATE TABLE messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL
);

CREATE INDEX idx_messages_session_id ON messages (session_id);
```

3. Set up row-level security (RLS) policies as needed for your use case.

## Monitoring and Logging

For production deployments, set up proper monitoring and logging:

1. **Logging**: Use a centralized logging solution like ELK Stack, Graylog, or cloud-native solutions:
   ```python
   # In your agent code
   import logging
   
   logging.basicConfig(
       level=os.getenv("LOG_LEVEL", "INFO"),
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )
   ```

2. **Metrics**: Implement Prometheus metrics for monitoring:
   ```python
   # Using the Prometheus client library
   from prometheus_client import Counter, Histogram, start_http_server
   
   # Define metrics
   request_count = Counter('agent_requests_total', 'Total number of requests')
   request_latency = Histogram('agent_request_latency_seconds', 'Request latency in seconds')
   
   # Start metrics server
   start_http_server(8000)
   ```

3. **Health Checks**: Ensure your agent has a proper health check endpoint:
   ```python
   @app.get("/health")
   async def health_check():
       # Check database connection
       try:
           supabase.table("messages").select("id").limit(1).execute()
           db_status = "healthy"
       except Exception:
           db_status = "unhealthy"
           
       return {
           "status": "healthy" if db_status == "healthy" else "unhealthy",
           "database": db_status,
           "version": "1.0.0"
       }
   ```

## Security Considerations

When deploying SolnAI agents, consider these security best practices:

1. **API Authentication**: Always use strong, unique tokens for the `API_BEARER_TOKEN`
2. **HTTPS**: Ensure all production deployments use HTTPS
3. **Secrets Management**: Use Kubernetes Secrets, AWS Secrets Manager, or similar services
4. **Network Security**: Restrict access to your agents using network policies or security groups
5. **Input Validation**: Validate all user inputs to prevent injection attacks
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Logging**: Don't log sensitive information like tokens or personal data

## Troubleshooting

Common issues and solutions:

### Connection Errors

**Problem**: Agent can't connect to Supabase
**Solution**: Check your Supabase URL and key, ensure network connectivity

```bash
# Test connection
curl -X GET "https://your-supabase-url/rest/v1/messages?limit=1" \
  -H "apikey: your-supabase-key" \
  -H "Authorization: Bearer your-supabase-key"
```

### Container Crashes

**Problem**: Docker container exits immediately
**Solution**: Check logs and ensure environment variables are set correctly

```bash
# View container logs
docker logs your-container-id
```

### Memory Issues

**Problem**: Agent runs out of memory
**Solution**: Increase memory limits in your deployment configuration

```yaml
# In Kubernetes
resources:
  limits:
    memory: "2Gi"  # Increase as needed
```

### API Timeouts

**Problem**: Requests to the agent time out
**Solution**: Adjust timeout settings in your proxy/load balancer

For nginx:
```
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
``` 