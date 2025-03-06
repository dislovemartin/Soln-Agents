"""
Simple web server for SolnAI-agents demonstration.

This is a simplified version of the example agent that doesn't require
external API dependencies for demonstration purposes.
"""

import os
import logging
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SolnAI Demo Agent",
    description="A simple demo agent for SolnAI",
    version="1.0.0"
)

# Create a directory for templates if it doesn't exist
os.makedirs("templates", exist_ok=True)

# Create a templates object
templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

# Create a model for the chat request
class ChatRequest(BaseModel):
    message: str

# Store chat history
chat_history = []

# Create a simple HTML template
with open(os.path.join(templates_dir, "index.html"), "w") as f:
    f.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SolnAI Demo Agent</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .chat-container {
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background-color: #e3f2fd;
            text-align: right;
        }
        .agent-message {
            background-color: #f1f1f1;
        }
        .input-container {
            display: flex;
            margin-top: 20px;
        }
        input[type="text"] {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            margin-left: 10px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SolnAI Demo Agent</h1>
        <p>A simple demonstration of the SolnAI agent framework</p>
    </div>
    <div class="chat-container">
        <div id="chat-messages">
            {% for message in chat_history %}
                <div class="message {{ 'user-message' if message.role == 'user' else 'agent-message' }}">
                    <strong>{{ message.role.capitalize() }}:</strong> {{ message.content }}
                </div>
            {% endfor %}
        </div>
        <form action="/chat" method="post" class="input-container">
            <input type="text" name="message" placeholder="Type your message here..." required>
            <button type="submit">Send</button>
        </form>
    </div>
</body>
</html>
    """)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "chat_history": chat_history})

@app.post("/chat", response_class=HTMLResponse)
async def chat(request: Request, message: str = Form(...)):
    # Add user message to chat history
    chat_history.append({"role": "user", "content": message})
    
    # Generate a simple response
    response = f"Thank you for your message: '{message}'. This is a demo agent for the SolnAI platform."
    
    # Add agent response to chat history
    chat_history.append({"role": "agent", "content": response})
    
    return templates.TemplateResponse("index.html", {"request": request, "chat_history": chat_history})

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    # Create templates directory if it doesn't exist
    os.makedirs("templates", exist_ok=True)
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8001)
