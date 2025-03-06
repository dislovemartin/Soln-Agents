"""
Integration with LangGraph for workflow orchestration.
"""

from typing import Any, Dict, List, Optional, Callable, Tuple, Union
from loguru import logger

from langgraph.graph import StateGraph
from langchain.schema.runnable import Runnable


class LangGraphIntegration:
    """
    Integration with LangGraph for workflow orchestration.
    """

    def __init__(self):
        """
        Initialize the LangGraph integration.
        """
        logger.info("Initialized LangGraph integration")

    def create_state_graph(self, state_type: Any) -> StateGraph:
        """
        Create a new LangGraph StateGraph.

        Args:
            state_type: Type for the state object

        Returns:
            StateGraph instance
        """
        return StateGraph(state_type)

    def add_workflow_step(
        self,
        graph: StateGraph,
        name: str,
        step_function: Callable[[Dict[str, Any]], Dict[str, Any]],
    ) -> None:
        """
        Add a step to a workflow graph.

        Args:
            graph: The StateGraph to add the step to
            name: Name of the step
            step_function: Function implementing the step
        """
        graph.add_node(name, step_function)
        logger.debug(f"Added step '{name}' to graph")

    def add_workflow_edge(
        self,
        graph: StateGraph,
        start_node: str,
        end_node: str,
    ) -> None:
        """
        Add an edge between two workflow steps.

        Args:
            graph: The StateGraph to add the edge to
            start_node: Starting node name
            end_node: Ending node name
        """
        graph.add_edge(start_node, end_node)
        logger.debug(f"Added edge from '{start_node}' to '{end_node}'")

    def add_conditional_edge(
        self,
        graph: StateGraph,
        start_node: str,
        condition_function: Callable[[Dict[str, Any]], str],
    ) -> None:
        """
        Add a conditional edge to a workflow graph.

        Args:
            graph: The StateGraph to add the conditional edge to
            start_node: Starting node name
            condition_function: Function that returns the next node name
        """
        graph.add_conditional_edges(start_node, condition_function)
        logger.debug(f"Added conditional edge from '{start_node}'")

    def set_entry_point(self, graph: StateGraph, entry_node: str) -> None:
        """
        Set the entry point for a workflow graph.

        Args:
            graph: The StateGraph to set the entry point for
            entry_node: Name of the entry node
        """
        graph.set_entry_point(entry_node)
        logger.debug(f"Set entry point to '{entry_node}'")

    def compile_graph(self, graph: StateGraph) -> Runnable:
        """
        Compile the workflow graph.

        Args:
            graph: The StateGraph to compile

        Returns:
            Compiled Runnable
        """
        compiled = graph.compile()
        logger.info("Compiled workflow graph")
        return compiled

    def execute_graph(
        self, compiled_graph: Runnable, initial_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a compiled workflow graph.

        Args:
            compiled_graph: Compiled graph to execute
            initial_state: Initial state for the workflow

        Returns:
            Final state after execution
        """
        logger.info("Executing workflow graph")
        try:
            return compiled_graph.invoke(initial_state)
        except Exception as e:
            logger.exception(f"Error executing workflow graph: {str(e)}")
            raise

    def stream_graph_execution(
        self, compiled_graph: Runnable, initial_state: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Stream execution of a compiled workflow graph.

        Args:
            compiled_graph: Compiled graph to execute
            initial_state: Initial state for the workflow

        Returns:
            List of states during execution
        """
        logger.info("Streaming workflow graph execution")
        try:
            states = list(compiled_graph.stream(initial_state))
            logger.info(f"Workflow execution completed with {len(states)} states")
            return states
        except Exception as e:
            logger.exception(f"Error streaming workflow graph execution: {str(e)}")
            raise

    def create_subgraph(
        self, main_graph: StateGraph, subgraph: Runnable, node_name: str
    ) -> None:
        """
        Add a subgraph as a node in the main graph.

        Args:
            main_graph: Main graph to add the subgraph to
            subgraph: Compiled subgraph to add
            node_name: Name for the subgraph node
        """
        main_graph.add_node(node_name, subgraph)
        logger.debug(f"Added subgraph as node '{node_name}'")
