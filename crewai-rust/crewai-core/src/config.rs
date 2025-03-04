use crate::crew::Crew;
use crate::errors::{CrewAIError, Result};
use std::fs;
use serde_yaml;

pub fn load_crew_from_yaml(path: &str) -> Result<Crew> {
    // Read file with proper error handling
    let yaml_str = fs::read_to_string(path)
        .map_err(|e| CrewAIError::IOError(e))?;
    
    // Parse YAML with proper error handling
    let crew: Crew = serde_yaml::from_str(&yaml_str)
        .map_err(|e| CrewAIError::YamlError(e))?;
    
    // Validate the loaded configuration
    crew.validate()?;
    
    Ok(crew)
}

pub fn validate_yaml_string(yaml_str: &str) -> Result<()> {
    // Try to parse the YAML string into a Crew
    let crew: Crew = serde_yaml::from_str(yaml_str)
        .map_err(|e| CrewAIError::YamlError(e))?;
    
    // Validate the crew configuration
    crew.validate()?;
    
    Ok(())
} 