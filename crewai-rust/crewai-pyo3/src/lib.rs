use pyo3::prelude::*;
use crewai_core::*;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use tokio::runtime::Runtime;
use pyo3::exceptions::{PyIOError, PyValueError, PyRuntimeError};
use pyo3_asyncio::tokio as pyo3_tokio;
use sysinfo::{System, SystemExt};
use crewai_core::errors::CrewAIError;

// Singleton Tokio runtime to avoid multiple runtime creation
static RUNTIME: Lazy<Mutex<Runtime>> = Lazy::new(|| {
    Mutex::new(Runtime::new().expect("Failed to create Tokio runtime"))
});

// Convert CrewAIError to PyErr for better Python error handling
// Using a function instead of impl From to avoid orphan rule issues
fn convert_error(err: CrewAIError) -> PyErr {
    match err {
        CrewAIError::IOError(e) => PyIOError::new_err(format!("IO error: {}", e)),
        CrewAIError::YamlError(e) => PyValueError::new_err(format!("YAML parsing error: {}", e)),
        CrewAIError::MissingField(msg) => PyValueError::new_err(format!("Missing field: {}", msg)),
        CrewAIError::InvalidConfig(msg) => PyValueError::new_err(format!("Invalid configuration: {}", msg)),
        CrewAIError::ExecutionError(msg) => PyRuntimeError::new_err(format!("Execution error: {}", msg)),
        CrewAIError::AsyncRuntimeError(msg) => PyRuntimeError::new_err(format!("Async runtime error: {}", msg)),
        CrewAIError::TaskPanic(msg) => PyRuntimeError::new_err(format!("Task panic: {}", msg)),
    }
}

#[pyclass(name = "Agent")]
#[derive(Debug, Clone)]
struct PyAgent { inner: Agent }

#[pymethods]
impl PyAgent {
    #[new]
    fn new(name: String, role: String, expertise: Option<String>) -> PyResult<Self> {
        let agent = Agent::new(name, role, expertise)
            .map_err(convert_error)?;
        Ok(PyAgent { inner: agent })
    }
    
    fn describe_role(&self) -> PyResult<String> { 
        Ok(self.inner.describe_role()) 
    }
    
    #[getter]
    fn name(&self) -> PyResult<String> { 
        Ok(self.inner.name.clone()) 
    }
    
    #[setter]
    fn set_name(&mut self, name: String) -> PyResult<()> { 
        if name.is_empty() {
            return Err(PyValueError::new_err("Agent name cannot be empty"));
        }
        self.inner.name = name; 
        Ok(()) 
    }
    
    #[getter]
    fn role(&self) -> PyResult<String> { 
        Ok(self.inner.role.clone()) 
    }
    
    #[setter]
    fn set_role(&mut self, role: String) -> PyResult<()> { 
        if role.is_empty() {
            return Err(PyValueError::new_err("Agent role cannot be empty"));
        }
        self.inner.role = role; 
        Ok(()) 
    }
    
    #[getter]
    fn expertise(&self) -> PyResult<Option<String>> {
        Ok(self.inner.expertise.clone())
    }
    
    #[setter]
    fn set_expertise(&mut self, expertise: Option<String>) -> PyResult<()> {
        self.inner.expertise = expertise;
        Ok(())
    }
}

#[pyclass(name = "TaskStatus")]
#[derive(Debug, Clone)]
struct PyTaskStatus { inner: TaskStatus }

#[pymethods]
impl PyTaskStatus {
    #[staticmethod]
    fn pending() -> Self {
        PyTaskStatus { inner: TaskStatus::Pending }
    }
    
    #[staticmethod]
    fn running() -> Self {
        PyTaskStatus { inner: TaskStatus::Running }
    }
    
    #[staticmethod]
    fn completed() -> Self {
        PyTaskStatus { inner: TaskStatus::Completed }
    }
    
    #[staticmethod]
    fn failed(error: String) -> Self {
        PyTaskStatus { inner: TaskStatus::Failed(error) }
    }
    
    fn __str__(&self) -> PyResult<String> {
        Ok(format!("{}", self.inner))
    }
    
    fn is_pending(&self) -> bool {
        matches!(self.inner, TaskStatus::Pending)
    }
    
    fn is_running(&self) -> bool {
        matches!(self.inner, TaskStatus::Running)
    }
    
    fn is_completed(&self) -> bool {
        matches!(self.inner, TaskStatus::Completed)
    }
    
    fn is_failed(&self) -> bool {
        matches!(self.inner, TaskStatus::Failed(_))
    }
    
    fn get_error(&self) -> Option<String> {
        match &self.inner {
            TaskStatus::Failed(err) => Some(err.clone()),
            _ => None,
        }
    }
}

#[pyclass(name = "Task")]
#[derive(Debug, Clone)]
struct PyTask { inner: Task }

#[pymethods]
impl PyTask {
    #[new]
    fn new(id: u32, description: String, expected_output: String, agent_name: Option<String>) -> PyResult<Self> {
        let task = Task::new(id, description, expected_output, agent_name)
            .map_err(convert_error)?;
        Ok(PyTask { inner: task })
    }
    
    fn execute(&self) -> PyResult<()> { 
        self.inner.execute().map_err(convert_error)
    }
    
    #[getter]
    fn description(&self) -> PyResult<String> { 
        Ok(self.inner.description.clone()) 
    }
    
    #[setter]
    fn set_description(&mut self, description: String) -> PyResult<()> {
        if description.is_empty() {
            return Err(PyValueError::new_err("Task description cannot be empty"));
        }
        self.inner.description = description;
        Ok(())
    }
    
    #[getter]
    fn id(&self) -> PyResult<u32> {
        Ok(self.inner.id)
    }
    
    #[getter]
    fn expected_output(&self) -> PyResult<String> {
        Ok(self.inner.expected_output.clone())
    }
    
    #[setter]
    fn set_expected_output(&mut self, expected_output: String) -> PyResult<()> {
        if expected_output.is_empty() {
            return Err(PyValueError::new_err("Task expected output cannot be empty"));
        }
        self.inner.expected_output = expected_output;
        Ok(())
    }
    
    #[getter]
    fn agent_name(&self) -> PyResult<Option<String>> {
        Ok(self.inner.agent_name.clone())
    }
    
    #[setter]
    fn set_agent_name(&mut self, agent_name: Option<String>) -> PyResult<()> {
        self.inner.agent_name = agent_name;
        Ok(())
    }
    
    #[getter]
    fn status(&self) -> PyResult<PyTaskStatus> {
        Ok(PyTaskStatus { inner: self.inner.status.clone() })
    }
}

#[pyclass(name = "Crew")]
#[derive(Debug, Clone)]
struct PyCrew { inner: Crew }

#[pymethods]
impl PyCrew {
    #[new]
    fn new(name: String, process: String) -> PyResult<Self> {
        let crew = Crew::new(name, process)
            .map_err(convert_error)?;
        Ok(PyCrew { inner: crew })
    }
    
    fn add_agent(&mut self, agent: PyAgent) -> PyResult<()> { 
        self.inner.add_agent(agent.inner.clone()); 
        Ok(()) 
    }
    
    fn add_task(&mut self, task: PyTask) -> PyResult<()> { 
        self.inner.add_task(task.inner.clone()); 
        Ok(()) 
    }
    
    fn validate(&self) -> PyResult<()> {
        self.inner.validate().map_err(convert_error)
    }
    
    fn execute_sequential(&mut self) -> PyResult<()> { 
        self.inner.execute_sequential().map_err(convert_error)
    }
    
    fn execute_parallel_rayon(&self) -> PyResult<()> { 
        self.inner.execute_parallel_rayon().map_err(convert_error)
    }
    
    // Thread-safe Tokio runtime access
    fn execute_concurrent_tokio(&self) -> PyResult<()> {
        let runtime = RUNTIME.lock()
            .map_err(|_| PyRuntimeError::new_err("Failed to acquire Tokio runtime lock"))?;
            
        runtime.block_on(async {
            self.inner.execute_concurrent_tokio().await
        }).map_err(convert_error)
    }
    
    // Async version using pyo3-asyncio
    #[pyo3(name = "execute_concurrent_tokio_async")]
    fn execute_concurrent_tokio_py<'p>(&self, py: Python<'p>) -> PyResult<&'p PyAny> {
        let inner_clone = self.inner.clone();
        pyo3_tokio::future_into_py(py, async move {
            inner_clone.execute_concurrent_tokio().await.map_err(convert_error)
        })
    }
    
    fn execute(&mut self) -> PyResult<()> {
        self.inner.execute().map_err(convert_error)
    }
    
    #[pyo3(name = "execute_async")]
    fn execute_async_py<'p>(&mut self, py: Python<'p>) -> PyResult<&'p PyAny> {
        let mut inner_clone = self.inner.clone();
        pyo3_tokio::future_into_py(py, async move {
            inner_clone.execute_async().await.map_err(convert_error)
        })
    }
    
    #[staticmethod]
    fn load_from_yaml(path: String) -> PyResult<PyCrew> {
        let crew_core = load_crew_from_yaml(&path)
            .map_err(convert_error)?;
        Ok(PyCrew { inner: crew_core })
    }
    
    fn benchmark_sequential_tasks(&mut self) -> PyResult<f64> {
        let (_, metrics) = Benchmark::measure(|| {
            self.inner.execute_sequential()
        }).map_err(convert_error)?;
        
        Ok(metrics.execution_time_secs())
    }
    
    fn get_memory_usage(&self) -> PyResult<u64> {
        let mut sys = System::new_all();
        sys.refresh_memory();
        Ok(sys.used_memory())
    }
}

#[pyfunction]
fn is_valid_yaml(yaml_str: String) -> PyResult<bool> {
    match validate_yaml_string(&yaml_str) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[pymodule]
fn crewai_rust(_py: Python, m: &PyModule) -> PyResult<()> {
    // Initialize logging without using the ? operator
    let _ = pyo3_log::init();
    
    m.add_class::<PyAgent>()?;
    m.add_class::<PyTask>()?;
    m.add_class::<PyTaskStatus>()?;
    m.add_class::<PyCrew>()?;
    
    // Add error handling helper functions
    m.add_function(wrap_pyfunction!(is_valid_yaml, m)?)?;
    
    Ok(())
} 