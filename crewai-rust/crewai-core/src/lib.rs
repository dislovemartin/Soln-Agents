pub mod agents;
pub mod tasks;
pub mod crew;
pub mod config;
pub mod execution;
pub mod tools;
pub mod errors;

pub use agents::Agent;
pub use tasks::{Task, TaskStatus};
pub use crew::Crew;
pub use config::{load_crew_from_yaml, validate_yaml_string};
pub use errors::{CrewAIError, Result};
pub use tools::{Benchmark, PerformanceMetrics};

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    
    #[test]
    fn test_agent_creation() {
        let agent_result = Agent::new(
            "Test Agent".to_string(),
            "Tester".to_string(),
            Some("Testing".to_string())
        );
        
        assert!(agent_result.is_ok());
        let agent = agent_result.unwrap();
        assert_eq!(agent.name, "Test Agent");
        assert_eq!(agent.role, "Tester");
        assert_eq!(agent.expertise, Some("Testing".to_string()));
    }
    
    #[test]
    fn test_agent_validation() {
        // Empty name
        let agent_result = Agent::new(
            "".to_string(),
            "Tester".to_string(),
            None
        );
        
        assert!(agent_result.is_err());
        
        // Empty role
        let agent_result = Agent::new(
            "Test Agent".to_string(),
            "".to_string(),
            None
        );
        
        assert!(agent_result.is_err());
    }
    
    #[test]
    fn test_task_creation() {
        let task_result = Task::new(
            1,
            "Test Task".to_string(),
            "Test Output".to_string(),
            Some("Test Agent".to_string())
        );
        
        assert!(task_result.is_ok());
        let task = task_result.unwrap();
        assert_eq!(task.id, 1);
        assert_eq!(task.description, "Test Task");
        assert_eq!(task.expected_output, "Test Output");
        assert_eq!(task.agent_name, Some("Test Agent".to_string()));
    }
    
    #[test]
    fn test_task_validation() {
        // Empty description
        let task_result = Task::new(
            1,
            "".to_string(),
            "Test Output".to_string(),
            None
        );
        
        assert!(task_result.is_err());
        
        // Empty expected output
        let task_result = Task::new(
            1,
            "Test Task".to_string(),
            "".to_string(),
            None
        );
        
        assert!(task_result.is_err());
    }
    
    #[test]
    fn test_crew_creation() {
        let crew_result = Crew::new(
            "Test Crew".to_string(),
            "sequential".to_string()
        );
        
        assert!(crew_result.is_ok());
        let crew = crew_result.unwrap();
        assert_eq!(crew.name, "Test Crew");
        assert_eq!(crew.process, "sequential");
        assert!(crew.agents.is_empty());
        assert!(crew.tasks.is_empty());
    }
    
    #[test]
    fn test_crew_validation() {
        // Empty name
        let crew_result = Crew::new(
            "".to_string(),
            "sequential".to_string()
        );
        
        assert!(crew_result.is_err());
        
        // Invalid process
        let crew_result = Crew::new(
            "Test Crew".to_string(),
            "invalid".to_string()
        );
        
        assert!(crew_result.is_err());
    }
    
    #[test]
    fn test_load_valid_crew_config() {
        let yaml_content = r#"
        name: "Test Crew"
        agents:
          - name: "Test Agent"
            role: "Tester"
        tasks:
          - id: 1
            description: "Test Task"
            expected_output: "Test Output"
            agent_name: "Test Agent"
        process: "sequential"
        "#;
        fs::write("test_config.yaml", yaml_content).unwrap();
        
        let result = load_crew_from_yaml("test_config.yaml");
        assert!(result.is_ok());
        
        let crew = result.unwrap();
        assert_eq!(crew.name, "Test Crew");
        assert_eq!(crew.agents.len(), 1);
        assert_eq!(crew.tasks.len(), 1);
        
        fs::remove_file("test_config.yaml").unwrap();
    }
    
    #[test]
    fn test_load_invalid_crew_config() {
        // Missing required fields
        let invalid_yaml = r#"
        agents:
          - name: "Test Agent"
            role: "Tester"
        tasks:
          - id: 1
            description: "Test Task"
            expected_output: "Test Output"
        process: "invalid_process"
        "#;
        fs::write("invalid_config.yaml", invalid_yaml).unwrap();
        
        let result = load_crew_from_yaml("invalid_config.yaml");
        assert!(result.is_err());
        
        fs::remove_file("invalid_config.yaml").unwrap();
    }
    
    #[test]
    fn test_agent_references() {
        // Task references non-existent agent
        let invalid_yaml = r#"
        name: "Test Crew"
        agents:
          - name: "Test Agent"
            role: "Tester"
        tasks:
          - id: 1
            description: "Test Task"
            expected_output: "Test Output"
            agent_name: "Non-existent Agent"
        process: "sequential"
        "#;
        fs::write("invalid_ref_config.yaml", invalid_yaml).unwrap();
        
        let result = load_crew_from_yaml("invalid_ref_config.yaml");
        assert!(result.is_err());
        
        fs::remove_file("invalid_ref_config.yaml").unwrap();
    }
} 