from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from crewai import Agent, Task, Crew, Process
import time
import os
import json
import logging
import psutil
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("crewai-service")

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load configs, initialize resources
    logger.info("Starting CrewAI Service")
    yield
    # Shutdown: Clean up resources
    logger.info("Shutting down CrewAI Service")

app = FastAPI(
    title="CrewAI Service", 
    version="1.0.0",
    lifespan=lifespan
)

class ToolCreate(BaseModel):
    """Tool configuration for CrewAI agents."""
    name: str
    description: str
    func_name: str
    args_schema: Optional[Dict[str, Any]] = None

class AgentCreate(BaseModel):
    """Agent configuration for CrewAI workflows."""
    name: str
    role: str
    goal: Optional[str] = None
    expertise: Optional[str] = None
    backstory: Optional[str] = None
    llm_config: Optional[Dict[str, Any]] = None
    tools: Optional[List[str]] = Field(default_factory=list)

class TaskCreate(BaseModel):
    """Task configuration for CrewAI workflows."""
    id: int
    description: str
    expected_output: str
    agent_name: str
    priority: Optional[int] = 5
    dependencies: Optional[List[int]] = Field(default_factory=list)
    context: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class CrewCreate(BaseModel):
    """Crew configuration for workflow execution."""
    name: str
    agents: List[AgentCreate]
    tasks: List[TaskCreate]
    execution_mode: str = "parallel"
    llm_config: Optional[Dict[str, Any]] = None

def get_memory_usage():
    """Get current memory usage in MB."""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    return memory_info.rss / 1024 / 1024  # Convert to MB

@app.get("/")
async def root():
    """Root endpoint to check service health."""
    return {"status": "ok", "service": "CrewAI Service"}

@app.post("/execute_crew")
async def execute_crew(crew_data: CrewCreate):
    """Execute a CrewAI workflow."""
    try:
        logger.info(f"Received execution request for crew: {crew_data.name}")
        
        # Create agents
        agents = []
        agent_map = {}  # Store by name for dependency resolution
        
        for agent_data in crew_data.agents:
            logger.info(f"Creating agent: {agent_data.name}")
            agent_name = agent_data.name
            
            # Process any LLM config
            llm_config = agent_data.llm_config or {}
            
            # Create agent with CrewAI API
            agent = Agent(
                role=agent_data.role,
                goal=agent_data.goal or f"To provide excellent {agent_data.role} expertise",
                backstory=agent_data.backstory or f"Expert in {agent_data.expertise or agent_data.role}",
                verbose=True,
                llm_config=llm_config
            )
            
            # Store name mapping externally since Agent object doesn't have name attribute
            agents.append(agent)
            agent_map[agent_name] = agent
        
        # Process tasks and handle dependencies
        tasks = []
        task_map = {}  # Store by ID for dependency resolution
        
        # First pass: create all tasks
        for task_data in crew_data.tasks:
            logger.info(f"Creating task: {task_data.id} for agent {task_data.agent_name}")
            # Find the agent for this task by name using our external mapping
            if task_data.agent_name in agent_map:
                agent = agent_map[task_data.agent_name]
            else:
                logger.warning(f"Agent {task_data.agent_name} not found, using first agent")
                agent = agents[0]
            
            task = Task(
                description=task_data.description,
                expected_output=task_data.expected_output,
                agent=agent
            )
            
            # Add context if provided
            if task_data.context:
                context_str = json.dumps(task_data.context)
                task.context = context_str
                
            tasks.append(task)
            task_map[task_data.id] = task
        
        # Second pass: set up dependencies
        for task_data in crew_data.tasks:
            if task_data.dependencies:
                task = task_map[task_data.id]
                for dep_id in task_data.dependencies:
                    if dep_id in task_map:
                        dep_task = task_map[dep_id]
                        # Just log for now since we're having issues with dependencies
                        logger.warning(f"Dependencies not supported in this CrewAI version: Task {task_data.id} should depend on {dep_id}")
        
        # Create and execute crew
        logger.info(f"Creating crew with {len(agents)} agents and {len(tasks)} tasks")
        # Always use sequential process for now due to compatibility issues with hierarchical
        process = Process.sequential
        
        # Set up crew with agents and tasks
        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=process,
            verbose=True
        )
        
        # Execute and time
        start_time = time.time()
        memory_before = get_memory_usage()
        
        logger.info(f"Starting crew execution with mode: {crew_data.execution_mode}")
        result = crew.kickoff()
        
        execution_time = time.time() - start_time
        memory_after = get_memory_usage()
        memory_used = memory_after - memory_before
        
        logger.info(f"Crew execution completed in {execution_time:.2f} seconds")
        
        return {
            "success": True,
            "result": result,
            "execution_time": execution_time,
            "memory_usage": memory_after,
            "memory_increase": memory_used
        }
    
    except Exception as e:
        logger.error(f"Error executing crew: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

