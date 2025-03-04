# Creating a New SolnAI Agent

This guide walks you through the process of creating a new agent for the SolnAI platform. By following these steps, you'll be able to develop, test, and deploy your own custom agent.

## Prerequisites

Before you begin, make sure you have the following:

- Docker installed
- Python 3.11+ installed
- Basic knowledge of FastAPI (for Python agents) or n8n (for workflow agents)
- Git for version control

## Step 1: Choose a Template

SolnAI provides two main templates to start with:

1. **Python Agent Template**: Located at `~sample-python-agent~`
2. **n8n Workflow Template**: Located at `~sample-n8n-agent~`

Choose the template that best fits your needs. For this guide, we'll use the Python agent template.

```bash
# Clone the repository if you haven't already
git clone https://github.com/your-org/SolnAI-agents.git
cd SolnAI-agents

# Create a new directory for your agent
cp -r ~sample-python-agent~ my-new-agent
cd my-new-agent
```

## Step 2: Configure Your Agent

### Update the README.md

Edit the README.md file to describe your agent:

```markdown
# My New Agent

Author: [Your Name](https://github.com/your-username)

A brief description of what your agent does and its key features.

## Features

- Feature 1
- Feature 2
- Feature 3

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your credentials
4. Run the agent:
   ```bash
   python main.py
   ```

## Usage

Describe how to use your agent, including API endpoints and example requests.
```

### Update the .env.example File

Edit the `.env.example` file to include any environment variables your agent needs:

```
API_BEARER_TOKEN=your_token_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
# Add any other environment variables your agent needs
```

## Step 3: Implement Your Agent

### Update main.py

The `main.py` file is the entry point for your agent. Edit it to implement your agent's functionality:

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional
from dotenv import load_dotenv
import logging
from supabase.client import create_client, Client

# Load environment variables
load_dotenv()

# FastAPI setup
app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model definitions
class AgentRequest(BaseModel):
    query: str
    user_id: str
    request_id: str
    session_id: str

class AgentResponse(BaseModel):
    success: bool
    output: str
    data: Optional[dict] = None
    error: Optional[str] = None

# Authentication
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != os.getenv("API_BEARER_TOKEN"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return credentials.credentials

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Store message in database
async def store_message(session_id: str, message: dict):
    try:
        supabase.table("messages").insert({
            "session_id": session_id,
            "message": message
        }).execute()
    except Exception as e:
        logger.error(f"Error storing message: {e}")

# Main endpoint
@app.post("/api/my-agent", response_model=AgentResponse)
async def process_request(request: AgentRequest, token: str = Depends(verify_token)):
    try:
        # Store user message
        await store_message(request.session_id, {
            "role": "user",
            "content": request.query,
            "metadata": {
                "user_id": request.user_id,
                "request_id": request.request_id
            }
        })
        
        # Process the request
        # TODO: Implement your agent's logic here
        result = f"Processed query: {request.query}"
        
        # Store AI response
        await store_message(request.session_id, {
            "role": "assistant",
            "content": result,
            "metadata": {
                "user_id": request.user_id,
                "request_id": request.request_id
            }
        })
        
        return AgentResponse(
            success=True,
            output=result,
            data={"processed": True}
        )
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return AgentResponse(
            success=False,
            output="An error occurred while processing your request.",
            error=str(e)
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
```

### Update requirements.txt

Make sure to include all the dependencies your agent needs:

```
fastapi==0.110.0
uvicorn==0.27.1
pydantic==2.6.1
python-dotenv==1.0.0
supabase==2.3.1
httpx==0.27.0
# Add any other dependencies your agent needs
```

### Update Dockerfile

Update the Dockerfile to build your agent:

```dockerfile
FROM ottomator/base-python:latest

# Build argument for port with default value
ARG PORT=8001
ENV PORT=${PORT}

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port from build argument
EXPOSE ${PORT}

# Command to run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
```

## Step 4: Test Your Agent

### Local Testing

Test your agent locally to make sure it works as expected:

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the agent
python main.py
```

You can test your agent using curl or a tool like Postman:

```bash
curl -X POST http://localhost:8001/api/my-agent \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test query",
    "user_id": "test-user",
    "request_id": "test-request",
    "session_id": "test-session"
  }'
```

### Docker Testing

Test your agent in a Docker container:

```bash
# Build the Docker image
docker build -t my-new-agent .

# Run the Docker container
docker run -p 8001:8001 --env-file .env my-new-agent
```

## Step 5: Deploy Your Agent

Once your agent is working correctly, you can deploy it to your environment:

### Docker Deployment

```bash
# Build the Docker image
docker build -t my-new-agent .

# Push the image to a registry (optional)
docker tag my-new-agent your-registry/my-new-agent:latest
docker push your-registry/my-new-agent:latest

# Run the Docker container
docker run -p 8001:8001 --env-file .env my-new-agent
```

### Kubernetes Deployment

Create a Kubernetes deployment file:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-new-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-new-agent
  template:
    metadata:
      labels:
        app: my-new-agent
    spec:
      containers:
      - name: my-new-agent
        image: your-registry/my-new-agent:latest
        ports:
        - containerPort: 8001
        env:
        - name: API_BEARER_TOKEN
          valueFrom:
            secretKeyRef:
              name: my-new-agent-secrets
              key: api-bearer-token
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: my-new-agent-secrets
              key: supabase-url
        - name: SUPABASE_KEY
          valueFrom:
            secretKeyRef:
              name: my-new-agent-secrets
              key: supabase-key
---
apiVersion: v1
kind: Service
metadata:
  name: my-new-agent
spec:
  selector:
    app: my-new-agent
  ports:
  - port: 80
    targetPort: 8001
  type: ClusterIP
```

Apply the deployment:

```bash
kubectl apply -f deployment.yaml
```

## Step 6: Document Your Agent

Make sure to document your agent thoroughly:

1. Update the README.md with detailed usage instructions
2. Add examples of API requests and responses
3. Document any environment variables or configuration options
4. Include troubleshooting tips

## Conclusion

Congratulations! You've created a new SolnAI agent. Your agent can now be used as part of the SolnAI ecosystem or as a standalone service.

Remember to follow best practices:
- Keep your code modular and maintainable
- Add comprehensive error handling
- Implement proper logging
- Secure your API endpoints
- Optimize resource usage

For more information, refer to the [SolnAI Agents Collection Overview](overview.md). 