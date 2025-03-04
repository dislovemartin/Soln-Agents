use crate::errors::Result;
use std::time::{Instant, Duration};

pub struct PerformanceMetrics {
    pub execution_time: Duration,
    pub memory_usage: Option<u64>,
}

impl PerformanceMetrics {
    pub fn new(execution_time: Duration, memory_usage: Option<u64>) -> Self {
        PerformanceMetrics {
            execution_time,
            memory_usage,
        }
    }
    
    pub fn execution_time_secs(&self) -> f64 {
        self.execution_time.as_secs_f64()
    }
}

pub struct Benchmark;

impl Benchmark {
    pub fn measure<F, T>(f: F) -> Result<(T, PerformanceMetrics)>
    where
        F: FnOnce() -> Result<T>,
    {
        let start_time = Instant::now();
        
        // Execute the function
        let result = f()?;
        
        let execution_time = start_time.elapsed();
        
        // We don't have a direct way to measure memory usage in Rust
        // This would require platform-specific code or external crates
        let memory_usage = None;
        
        Ok((result, PerformanceMetrics::new(execution_time, memory_usage)))
    }
} 