"""
FastAPI server for AutoGroq.
"""

import os
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from loguru import logger

from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow

# Load environment variables
load_dotenv()

# Initialize the FastAPI app
app = FastAPI(
    title="AutoGroq API",
    description="API for AutoGroq agent workflows",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the AutoGroq manager
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY environment variable not set. Some features may not work.")

manager = AutoGroqManager(
    api_key=api_key,
    default_model="llama3-70b-8192",
    langsmith_project="autogroq-api",
)


# Request and response models
class WorkflowRequest(BaseModel):
    """Request model for workflow execution."""
    task: str
    team_size: int = 3
    model: str = "llama3-70b-8192"
    workflow_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class WorkflowResponse(BaseModel):
    """Response model for workflow execution."""
    workflow_id: str
    workflow_name: str
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    steps: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}


class ModelsResponse(BaseModel):
    """Response model for models endpoint."""
    models: List[str]


# API key authentication
def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key."""
    expected_key = os.getenv("AUTOGROQ_API_KEY")
    if not expected_key:
        # If no API key is set, allow all requests
        return True
    if x_api_key \!= expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to AutoGroq API", "version": "0.1.0"}


@app.get("/models", response_model=ModelsResponse)
async def get_models(_: bool = Depends(verify_api_key)):
    """Get available models."""
    try:
        models = manager.list_available_models()
        return {"models": models}
    except Exception as e:
        logger.exception("Error getting models")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/workflows/dynamic-team", response_model=WorkflowResponse)
async def execute_dynamic_team(
    request: WorkflowRequest, _: bool = Depends(verify_api_key)
):
    """Execute a dynamic team workflow."""
    try:
        workflow = DynamicTeamWorkflow(
            task=request.task,
            team_size=request.team_size,
            model=request.model,
            name=request.workflow_name,
        )
        
        parameters = request.parameters or {}
        
        result = manager.execute_workflow(workflow, inputs=parameters)
        
        steps = []
        for step in result.steps:
            steps.append({
                "name": step.step_name,
                "success": step.success,
                "output": str(step.output) if step.output else None,
                "error": step.error,
            })
        
        return WorkflowResponse(
            workflow_id=workflow.name,
            workflow_name=workflow.name,
            success=result.success,
            result=result.final_output,
            error=result.error,
            steps=steps,
            metadata={
                "task": request.task,
                "team_size": request.team_size,
                "model": request.model,
            }
        )
        
    except Exception as e:
        logger.exception(f"Error executing workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run("server:app", host=host, port=port, reload=True)
