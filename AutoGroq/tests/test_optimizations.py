#!/usr/bin/env python3
"""
Unit tests for performance optimizations.
"""

import os
import sys
import unittest
import asyncio
import time
from unittest.mock import MagicMock, patch
import tempfile
import shutil

# Add the parent directory to sys.path to import AutoGroq modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import modules to test
from src.utils.benchmarking import PerformanceBenchmark
try:
    from src.integrations.optimized_crewai_integration import (
        OptimizedCrewAIIntegration,
        PerformanceMetrics, 
        CREWAI_RUST_AVAILABLE
    )
    OPTIMIZED_INTEGRATION_AVAILABLE = True
except ImportError:
    # Create a mock if the module is not available
    OptimizedCrewAIIntegration = MagicMock
    PerformanceMetrics = MagicMock
    CREWAI_RUST_AVAILABLE = False
    OPTIMIZED_INTEGRATION_AVAILABLE = False

try:
    from src.workflows.optimized_workflow import (
        OptimizedWorkflow,
        OptimizedTeamWorkflow,
        ResourceMonitor,
        ResultCache
    )
    OPTIMIZED_WORKFLOW_AVAILABLE = True
except ImportError:
    # Create mocks if modules are not available
    OptimizedWorkflow = MagicMock
    OptimizedTeamWorkflow = MagicMock
    ResourceMonitor = MagicMock
    ResultCache = MagicMock
    OPTIMIZED_WORKFLOW_AVAILABLE = False


class TestPerformanceMetrics(unittest.TestCase):
    """Test the PerformanceMetrics class."""
    
    @unittest.skipIf(not OPTIMIZED_INTEGRATION_AVAILABLE, "OptimizedCrewAIIntegration not available")
    def test_performance_metrics_basic(self):
        """Test basic functionality of PerformanceMetrics."""
        metrics = PerformanceMetrics()
        
        # Test start and stop monitoring
        metrics.start_monitoring()
        self.assertIsNotNone(metrics.start_time)
        
        # Sleep to simulate work
        time.sleep(0.1)
        
        metrics.stop_monitoring()
        self.assertGreater(metrics.total_execution_time, 0.0)
        
        # Test recording task execution
        metrics.record_task_execution(1, 0.5)
        self.assertEqual(metrics.execution_times[1], 0.5)
        
        # Test resource sampling
        metrics.sample_resource_usage(1)
        self.assertIn(1, metrics.memory_usage_samples)
        self.assertIn(1, metrics.cpu_usage_samples)
        
        # Test global sampling
        metrics.sample_resource_usage()
        self.assertIn('global', metrics.memory_usage_samples)
        self.assertIn('global', metrics.cpu_usage_samples)
        
        # Test report generation
        report = metrics.get_report()
        self.assertIn('total_execution_time_seconds', report)
        self.assertIn('peak_memory_usage_mb', report)
        self.assertIn('task_execution_times', report)


class TestResourceMonitor(unittest.TestCase):
    """Test the ResourceMonitor class."""
    
    @unittest.skipIf(not OPTIMIZED_WORKFLOW_AVAILABLE, "OptimizedWorkflow not available")
    def test_resource_monitor_basic(self):
        """Test basic functionality of ResourceMonitor."""
        monitor = ResourceMonitor(
            memory_threshold=95.0,  # High threshold to avoid triggering actions
            cpu_threshold=95.0,
            check_interval=0.1
        )
        
        # Test start and stop monitoring
        async def test_monitoring():
            await monitor.start_monitoring()
            await asyncio.sleep(0.3)  # Allow time for a few monitoring cycles
            await monitor.stop_monitoring()
            
            # Check that monitoring collected samples
            self.assertGreater(len(monitor.resource_samples), 0)
            self.assertGreaterEqual(monitor.peak_memory_usage, 0.0)
            self.assertGreaterEqual(monitor.peak_cpu_usage, 0.0)
            
            # Test report generation
            report = monitor.get_resource_report()
            self.assertIn('peak_memory_usage_percent', report)
            self.assertIn('peak_cpu_usage_percent', report)
            self.assertIn('samples', report)
        
        asyncio.run(test_monitoring())


class TestResultCache(unittest.TestCase):
    """Test the ResultCache class."""
    
    @unittest.skipIf(not OPTIMIZED_WORKFLOW_AVAILABLE, "OptimizedWorkflow not available")
    def test_result_cache_basic(self):
        """Test basic functionality of ResultCache."""
        # Create a temporary directory for testing
        temp_dir = tempfile.mkdtemp()
        try:
            cache = ResultCache(cache_dir=temp_dir)
            
            # Test key generation
            key1 = cache.generate_key("workflow1", {"param1": "value1"})
            key2 = cache.generate_key("workflow1", {"param1": "value2"})
            self.assertNotEqual(key1, key2)
            
            # Test setting and getting values
            test_value = {"result": "test_result", "metadata": {"test": True}}
            cache.set(key1, test_value)
            
            retrieved_value = cache.get(key1)
            self.assertEqual(retrieved_value, test_value)
            
            # Test missing key
            self.assertIsNone(cache.get("non_existent_key"))
        finally:
            # Clean up
            shutil.rmtree(temp_dir)


class TestPerformanceBenchmark(unittest.TestCase):
    """Test the PerformanceBenchmark class."""
    
    def test_benchmark_basic(self):
        """Test basic functionality of PerformanceBenchmark."""
        # Create a temporary directory for testing
        temp_dir = tempfile.mkdtemp()
        try:
            benchmark = PerformanceBenchmark(output_dir=temp_dir, save_charts=False)
            
            # Define a simple test function
            def test_func():
                time.sleep(0.1)  # Simulate work
                return {"success": True, "execution_time": 0.1, "memory_usage": 100}
            
            # Run a benchmark
            result = benchmark.run_benchmark(
                name="test_benchmark",
                execution_func=test_func,
                params={"test_param": "test_value"},
                iterations=2
            )
            
            # Check that the benchmark was recorded correctly
            self.assertEqual(result["name"], "test_benchmark")
            self.assertEqual(result["params"], {"test_param": "test_value"})
            self.assertEqual(result["iterations"], 2)
            self.assertEqual(len(result["execution_times"]), 2)
            
            # Run another benchmark
            benchmark.run_benchmark(
                name="test_benchmark_2",
                execution_func=test_func,
                params={"test_param": "test_value_2"},
                iterations=2
            )
            
            # Test comparison
            comparison = benchmark.compare_benchmarks(
                benchmarks=["test_benchmark", "test_benchmark_2"],
                metrics=["avg_execution_time"]
            )
            
            self.assertIn("avg_execution_time", comparison)
            self.assertIn("test_benchmark", comparison["avg_execution_time"])
            self.assertIn("test_benchmark_2", comparison["avg_execution_time"])
            
            # Test report generation
            report_path = benchmark.generate_report()
            self.assertTrue(os.path.exists(report_path))
        finally:
            # Clean up
            shutil.rmtree(temp_dir)


class TestOptimizedCrewAIIntegration(unittest.TestCase):
    """Test the OptimizedCrewAIIntegration class."""
    
    @unittest.skipIf(not OPTIMIZED_INTEGRATION_AVAILABLE or not CREWAI_RUST_AVAILABLE,
                     "OptimizedCrewAIIntegration or CrewAI-Rust not available")
    @patch('crewai_rust.Agent')
    @patch('crewai_rust.Task')
    @patch('crewai_rust.Crew')
    def test_task_ordering_optimization(self, mock_crew, mock_task, mock_agent):
        """Test task ordering optimization."""
        integration = OptimizedCrewAIIntegration(
            execution_mode="parallel",
            enable_performance_monitoring=False
        )
        
        # Create mock tasks with dependencies
        task1 = MagicMock()
        task1.id = 1
        task1._dependencies = []
        task1._priority = 5
        
        task2 = MagicMock()
        task2.id = 2
        task2._dependencies = [1]  # Depends on task1
        task2._priority = 10
        
        task3 = MagicMock()
        task3.id = 3
        task3._dependencies = []
        task3._priority = 3
        
        # Test optimization
        tasks = [task2, task3, task1]  # Deliberately out of order
        sorted_tasks = integration._optimize_task_order(tasks)
        
        # Both task1 and task3 have no dependencies
        # task1 has priority 5, task3 has priority 3
        # task2 depends on task1, so it should come after task1
        # The exact order might vary depending on implementation details,
        # but task1 should always come before task2
        
        actual_ids = [task.id for task in sorted_tasks]
        
        # Verify that task1 comes before task2 (dependency ordering)
        task1_position = actual_ids.index(1)
        task2_position = actual_ids.index(2)
        self.assertLess(task1_position, task2_position, "Task 1 should come before Task 2 due to dependency")


class TestOptimizedWorkflow(unittest.TestCase):
    """Test the OptimizedWorkflow class."""
    
    @unittest.skipIf(not OPTIMIZED_WORKFLOW_AVAILABLE, "OptimizedWorkflow not available")
    def test_team_role_optimization(self):
        """Test team role optimization in OptimizedTeamWorkflow."""
        # Test different team sizes
        workflow1 = OptimizedTeamWorkflow(
            task="Test task",
            team_size=1,
            enable_resource_monitoring=False,
            use_caching=False
        )
        roles1 = workflow1._get_team_roles(1)
        self.assertEqual(len(roles1), 1)
        self.assertEqual(roles1[0]["title"], "Generalist")
        
        workflow3 = OptimizedTeamWorkflow(
            task="Test task",
            team_size=3,
            enable_resource_monitoring=False,
            use_caching=False
        )
        roles3 = workflow3._get_team_roles(3)
        self.assertEqual(len(roles3), 3)
        self.assertEqual(roles3[0]["title"], "Researcher")
        self.assertEqual(roles3[1]["title"], "Analyst")
        self.assertEqual(roles3[2]["title"], "Creator")
        
        # Test dependencies
        self.assertEqual(roles3[0]["dependencies"], [])
        self.assertEqual(roles3[1]["dependencies"], [1])
        self.assertEqual(roles3[2]["dependencies"], [2])
        
        # Test priority ordering
        self.assertGreater(roles3[0]["priority"], roles3[1]["priority"])
        self.assertGreater(roles3[1]["priority"], roles3[2]["priority"])


if __name__ == "__main__":
    unittest.main()