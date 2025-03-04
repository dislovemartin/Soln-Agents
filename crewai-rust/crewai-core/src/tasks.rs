use serde::{Serialize, Deserialize};
use crate::errors::{CrewAIError, Result};
use std::fmt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: u32,
    pub description: String,
    pub expected_output: String,
    pub agent_name: Option<String>,
    #[serde(skip)]
    pub status: TaskStatus,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed(String),
}

impl fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TaskStatus::Pending => write!(f, "Pending"),
            TaskStatus::Running => write!(f, "Running"),
            TaskStatus::Completed => write!(f, "Completed"),
            TaskStatus::Failed(err) => write!(f, "Failed: {}", err),
        }
    }
}

impl Default for TaskStatus {
    fn default() -> Self {
        TaskStatus::Pending
    }
}

impl Task {
    pub fn new(id: u32, description: String, expected_output: String, agent_name: Option<String>) -> Result<Self> {
        // Validate input
        if description.is_empty() {
            return Err(CrewAIError::MissingField("Task description cannot be empty".into()));
        }
        
        if expected_output.is_empty() {
            return Err(CrewAIError::MissingField("Task expected output cannot be empty".into()));
        }
        
        Ok(Task { 
            id, 
            description, 
            expected_output, 
            agent_name,
            status: TaskStatus::Pending,
        })
    }
    
    pub fn execute(&self) -> Result<()> {
        // This is a placeholder for actual task execution
        // In a real implementation, this would call an LLM or perform actual work
        println!("Executing task {}: {}", self.id, self.description);
        
        // Simulate some work
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        Ok(())
    }
    
    pub fn set_status(&mut self, status: TaskStatus) {
        self.status = status;
    }
    
    pub fn get_status(&self) -> &TaskStatus {
        &self.status
    }
} 