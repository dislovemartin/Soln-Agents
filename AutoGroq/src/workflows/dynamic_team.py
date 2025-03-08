"""
Dynamic Team Workflow for AutoGroq.
"""

from typing import Any, Dict, List, Optional, Tuple, TypedDict, cast
import uuid
from loguru import logger
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

from .base import BaseWorkflow, WorkflowResult, WorkflowStepResult


class AgentState(TypedDict, total=False):
    """State representation for the dynamic team workflow."""
    task: str
    team_size: int
    model: str
    team: List[Dict[str, Any]]
    status: str
    error: Optional[str]
    analysis: Dict[str, Any]
    plan: Dict[str, Any]
    execution_results: List[Dict[str, Any]]
    final_result: str
    completed_steps: List[str]
    messages: List[Dict[str, Any]]
    artifacts: Dict[str, Any]
    current_step: str


class DynamicTeamWorkflow(BaseWorkflow):
    """
    Workflow that dynamically creates a team of agents to solve a task.
    """

    def __init__(
        self,
        task: str,
        team_size: int = 3,
        model: str = "llama3-70b-8192",
        max_iterations: int = 10,
        name: str = None,
    ):
        """
        Initialize a dynamic team workflow.

        Args:
            task: The task to solve
            team_size: Number of agents in the team
            model: Groq model to use
            max_iterations: Maximum number of iterations
            name: Optional name for the workflow
        """
        name = name or f"dynamic-team-{uuid.uuid4().hex[:8]}"
        super().__init__(name=name, description=f"Dynamic team workflow for: {task}")
        self.task = task
        self.team_size = team_size
        self.model = model
        self.max_iterations = max_iterations
        self.graph = None
        logger.info(f"Created dynamic team workflow with task: {task}")

    def build(self) -> StateGraph:
        """
        Build the workflow graph.

        Returns:
            A LangGraph StateGraph
        """
        # Define the nodes (steps) in our workflow
        def analyze_task(state: Dict[str, Any]) -> Dict[str, Any]:
            """Analyze the task and determine required expertise."""
            logger.info(f"Analyzing task: {state['task']}")
            # In a real implementation, we'd use the Groq client here
            state["analysis"] = {
                "complexity": "medium",
                "domains": ["research", "analysis", "writing"],
                "estimated_time": "2 hours"
            }
            state["status"] = "analyzed"
            state["current_step"] = "analyze_task"
            
            # Track completed steps
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("analyze_task")
            state["analyze_task_result"] = "Task analyzed successfully"
            state["analyze_task_timestamp"] = str(uuid.uuid4())  # Use UUID as a timestamp substitute
            return state

        def create_team(state: Dict[str, Any]) -> Dict[str, Any]:
            """Create a team of agents based on the task analysis."""
            logger.info("Creating agent team")
            # In a real implementation, we'd use the CrewAI-Rust integration
            state["team"] = [
                {"id": f"agent-{i}", "role": f"Agent {i}", "expertise": "domain"}
                for i in range(self.team_size)
            ]
            state["status"] = "team_created"
            state["current_step"] = "create_team"
            
            # Track completed steps
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("create_team")
            state["create_team_result"] = "Team created successfully"
            state["create_team_timestamp"] = str(uuid.uuid4())
            return state

        def plan_execution(state: Dict[str, Any]) -> Dict[str, Any]:
            """Create an execution plan for the team."""
            logger.info("Planning execution strategy")
            state["plan"] = {
                "steps": [
                    {"step": 1, "description": "Initial research", "agent_id": "agent-0"},
                    {"step": 2, "description": "Analysis", "agent_id": "agent-1"},
                    {"step": 3, "description": "Report creation", "agent_id": "agent-2"}
                ]
            }
            state["status"] = "planned"
            state["current_step"] = "plan_execution"
            
            # Track completed steps
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("plan_execution")
            state["plan_execution_result"] = "Execution plan created"
            state["plan_execution_timestamp"] = str(uuid.uuid4())
            return state

        def execute_plan(state: Dict[str, Any]) -> Dict[str, Any]:
            """Execute the plan with the agent team."""
            logger.info("Executing team plan")
            # In a real implementation, we'd use the Groq client for agent interactions
            state["execution_results"] = [
                {"step": 1, "output": "Research results", "agent_id": "agent-0"},
                {"step": 2, "output": "Analysis report", "agent_id": "agent-1"},
                {"step": 3, "output": "Final report", "agent_id": "agent-2"}
            ]
            state["status"] = "executed"
            state["current_step"] = "execute_plan"
            
            # Track completed steps
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("execute_plan")
            state["execute_plan_result"] = "Plan executed successfully"
            state["execute_plan_timestamp"] = str(uuid.uuid4())
            return state

        def synthesize_results(state: Dict[str, Any]) -> Dict[str, Any]:
            """Synthesize results from all agents."""
            logger.info("Synthesizing results")
            # Combine all results into a final output
            state["final_result"] = f"Final synthesized result for task: {state['task']}"
            state["status"] = "completed"
            state["current_step"] = "synthesize_results"
            
            # Track completed steps
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("synthesize_results")
            state["synthesize_results_result"] = "Results synthesized successfully"
            state["synthesize_results_timestamp"] = str(uuid.uuid4())
            return state

        def handle_error(state: Dict[str, Any]) -> Dict[str, Any]:
            """Handle errors in the workflow."""
            logger.error(f"Error in workflow: {state.get('error', 'Unknown error')}")
            state["status"] = "failed"
            state["error_message"] = str(state.get("error", "Unknown error"))
            state["current_step"] = "handle_error"
            
            # Track error as a step
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("handle_error")
            state["handle_error_result"] = f"Error handled: {state.get('error', 'Unknown error')}"
            state["handle_error_timestamp"] = str(uuid.uuid4())
            return state

        # Create the graph with TypedDict state
        builder = StateGraph(AgentState)
        
        # Add nodes to the graph
        builder.add_node("analyze_task", analyze_task)
        builder.add_node("create_team", create_team)
        builder.add_node("plan_execution", plan_execution)
        builder.add_node("execute_plan", execute_plan)
        builder.add_node("synthesize_results", synthesize_results)
        builder.add_node("handle_error", handle_error)
        
        # Define the edges
        builder.add_edge("analyze_task", "create_team")
        builder.add_edge("create_team", "plan_execution")
        builder.add_edge("plan_execution", "execute_plan")
        builder.add_edge("execute_plan", "synthesize_results")
        
        # Define conditional edges for error handling
        # Note: Changed to use more robust conditional routing
        def router_with_error_check(state: AgentState, current_node: str, next_node: str):
            """Route to error handler if there's an error, otherwise to the next node"""
            if "error" in state and state["error"]:
                return "handle_error"
            return next_node
            
        builder.add_conditional_edges(
            "analyze_task",
            lambda state: router_with_error_check(state, "analyze_task", "create_team")
        )
        
        builder.add_conditional_edges(
            "create_team",
            lambda state: router_with_error_check(state, "create_team", "plan_execution")
        )
        
        builder.add_conditional_edges(
            "plan_execution",
            lambda state: router_with_error_check(state, "plan_execution", "execute_plan")
        )
        
        builder.add_conditional_edges(
            "execute_plan",
            lambda state: router_with_error_check(state, "execute_plan", "synthesize_results")
        )
        
        # Define the entry point
        builder.set_entry_point("analyze_task")
        
        # In LangGraph 0.3.5, we use END for terminal nodes
        builder.add_edge("synthesize_results", END)
        builder.add_edge("handle_error", END)
        
        # Compile the graph
        self.graph = builder.compile()
        logger.info("Dynamic team workflow graph built successfully")
        
        return self.graph

    def execute(self, inputs: Dict[str, Any], run_tree: Optional[Any] = None) -> WorkflowResult:
        """
        Execute the workflow.

        Args:
            inputs: Input parameters for the workflow
            run_tree: Optional RunTree for tracing

        Returns:
            WorkflowResult containing the execution results
        """
        if self.graph is None:
            self.build()
            
        # Prepare the initial state
        initial_state: AgentState = {
            "task": self.task,
            "team_size": self.team_size,
            "model": self.model,
            "status": "initialized",
            "messages": [],
            "artifacts": {},
            "completed_steps": [],
            "current_step": "analyze_task",
        }
        
        # Update with any additional inputs
        for key, value in inputs.items():
            initial_state[key] = value
        
        try:
            # Execute the graph
            logger.info(f"Executing workflow: {self.name}")
            
            # Use next() instead of streaming to get the final state directly
            final_state = self.graph.invoke(initial_state)
            
            # Create step results
            steps = []
            for step in ["analyze_task", "create_team", "plan_execution", "execute_plan", "synthesize_results"]:
                if step in final_state.get("completed_steps", []):
                    steps.append(
                        WorkflowStepResult(
                            step_name=step,
                            success=True,
                            output=final_state.get(f"{step}_result", "Completed"),
                            metadata={"timestamp": final_state.get(f"{step}_timestamp", "")}
                        )
                    )
            
            # Create the final result
            success = final_state.get("status") == "completed"
            result = WorkflowResult(
                workflow_name=self.name,
                success=success,
                steps=steps,
                final_output=final_state.get("final_result", "No result available"),
                error=final_state.get("error_message") if not success else None,
                metadata={
                    "task": self.task,
                    "team_size": self.team_size,
                    "model": self.model,
                }
            )
            
            return result
            
        except Exception as e:
            logger.exception(f"Error executing workflow: {str(e)}")
            return WorkflowResult(
                workflow_name=self.name,
                success=False,
                error=str(e),
                metadata={
                    "task": self.task,
                    "team_size": self.team_size,
                    "model": self.model,
                }
            )
