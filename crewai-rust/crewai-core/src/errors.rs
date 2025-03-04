use thiserror::Error;

#[derive(Error, Debug)]
pub enum CrewAIError {
    #[error("IO error: {0}")]
    IOError(#[from] std::io::Error),
    
    #[error("YAML parsing error: {0}")]
    YamlError(#[from] serde_yaml::Error),
    
    #[error("Missing required field: {0}")]
    MissingField(String),
    
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    
    #[error("Execution error: {0}")]
    ExecutionError(String),
    
    #[error("Async runtime error: {0}")]
    AsyncRuntimeError(String),
    
    #[error("Task panic: {0}")]
    TaskPanic(String),
}

pub type Result<T> = std::result::Result<T, CrewAIError>; 