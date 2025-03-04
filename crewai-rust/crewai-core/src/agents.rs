use serde::{Serialize, Deserialize};
use crate::errors::{CrewAIError, Result};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Agent {
    pub name: String,
    pub role: String,
    pub expertise: Option<String>,
}

impl Agent {
    pub fn new(name: String, role: String, expertise: Option<String>) -> Result<Self> {
        // Validate input
        if name.is_empty() {
            return Err(CrewAIError::MissingField("Agent name cannot be empty".into()));
        }
        if role.is_empty() {
            return Err(CrewAIError::MissingField("Agent role cannot be empty".into()));
        }
        
        Ok(Agent { name, role, expertise })
    }
    
    pub fn describe_role(&self) -> String {
        match &self.expertise {
            Some(expertise) => format!("Agent '{}' with role '{}' and expertise in '{}'", 
                                      self.name, self.role, expertise),
            None => format!("Agent '{}' with role '{}'", self.name, self.role),
        }
    }
} 