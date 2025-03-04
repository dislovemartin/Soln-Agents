use crate::agents::Agent;
use crate::tasks::Task;
use crate::errors::{CrewAIError, Result};
use crate::execution::{execute_tasks_sequentially, execute_tasks_rayon, execute_tasks_tokio};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Crew {
    pub name: String,
    pub agents: Vec<Agent>,
    pub tasks: Vec<Task>,
    pub process: String,
}

impl Crew {
    pub fn new(name: String, process: String) -> Result<Self> {
        // Validate input
        if name.is_empty() {
            return Err(CrewAIError::MissingField("Crew name cannot be empty".into()));
        }
        
        // Validate process type
        if !["sequential", "parallel", "async"].contains(&process.as_str()) {
            return Err(CrewAIError::InvalidConfig(
                format!("Invalid process type: {}. Must be 'sequential', 'parallel', or 'async'", process)
            ));
        }
        
        Ok(Crew {
            name,
            agents: Vec::new(),
            tasks: Vec::new(),
            process,
        })
    }
    
    pub fn add_agent(&mut self, agent: Agent) {
        self.agents.push(agent);
    }
    
    pub fn add_task(&mut self, task: Task) {
        self.tasks.push(task);
    }
    
    pub fn get_agent_by_name(&self, name: &str) -> Option<&Agent> {
        self.agents.iter().find(|agent| agent.name == name)
    }
    
    pub fn validate(&self) -> Result<()> {
        // Ensure we have at least one agent
        if self.agents.is_empty() {
            return Err(CrewAIError::InvalidConfig("Crew must have at least one agent".into()));
        }
        
        // Ensure we have at least one task
        if self.tasks.is_empty() {
            return Err(CrewAIError::InvalidConfig("Crew must have at least one task".into()));
        }
        
        // Ensure all tasks with agent_name reference valid agents
        for task in &self.tasks {
            if let Some(agent_name) = &task.agent_name {
                if !self.agents.iter().any(|a| &a.name == agent_name) {
                    return Err(CrewAIError::InvalidConfig(
                        format!("Task references agent '{}' which doesn't exist in the crew", agent_name)
                    ));
                }
            }
        }
        
        Ok(())
    }
    
    pub fn execute_sequential(&mut self) -> Result<()> {
        println!("Starting sequential execution for crew: {}", self.name);
        self.validate()?;
        execute_tasks_sequentially(&mut self.tasks)?;
        println!("Sequential execution finished.");
        Ok(())
    }
    
    pub fn execute_parallel_rayon(&self) -> Result<()> {
        println!("Starting parallel execution (Rayon) for crew: {}", self.name);
        self.validate()?;
        execute_tasks_rayon(&self.tasks)?;
        println!("Parallel execution (Rayon) finished.");
        Ok(())
    }
    
    pub async fn execute_concurrent_tokio(&self) -> Result<()> {
        println!("Starting concurrent execution (Tokio) for crew: {}", self.name);
        self.validate()?;
        execute_tasks_tokio(self.tasks.clone()).await?;
        println!("Concurrent execution (Tokio) finished.");
        Ok(())
    }
    
    pub fn execute(&mut self) -> Result<()> {
        match self.process.as_str() {
            "sequential" => self.execute_sequential(),
            "parallel" => self.execute_parallel_rayon(),
            "async" => {
                return Err(CrewAIError::InvalidConfig(
                    "Cannot execute async process synchronously. Use execute_async() instead.".into()
                ));
            },
            _ => {
                return Err(CrewAIError::InvalidConfig(
                    format!("Unknown process type: {}", self.process)
                ));
            }
        }
    }
    
    pub async fn execute_async(&mut self) -> Result<()> {
        match self.process.as_str() {
            "sequential" => self.execute_sequential(),
            "parallel" => self.execute_parallel_rayon(),
            "async" => self.execute_concurrent_tokio().await,
            _ => {
                return Err(CrewAIError::InvalidConfig(
                    format!("Unknown process type: {}", self.process)
                ));
            }
        }
    }
} 