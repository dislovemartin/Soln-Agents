use crate::tasks::{Task, TaskStatus};
use crate::errors::{CrewAIError, Result};
use rayon::prelude::*;
use tokio::task;
use futures::future::join_all;
use std::sync::{Arc, Mutex};

pub fn execute_tasks_sequentially(tasks: &mut [Task]) -> Result<()> {
    println!("Executing tasks sequentially...");
    for task in tasks.iter_mut() {
        println!("Starting task {}: {}", task.id, task.description);
        task.set_status(TaskStatus::Running);
        
        match task.execute() {
            Ok(_) => {
                println!("Task {} completed successfully", task.id);
                task.set_status(TaskStatus::Completed);
            },
            Err(e) => {
                let error_msg = format!("Task {} failed: {}", task.id, e);
                println!("{}", error_msg);
                task.set_status(TaskStatus::Failed(error_msg));
                return Err(CrewAIError::ExecutionError(
                    format!("Failed to execute task {}: {}", task.id, e)
                ));
            }
        }
    }
    println!("Sequential task execution completed.");
    Ok(())
}

pub fn execute_tasks_rayon(tasks: &[Task]) -> Result<()> {
    println!("Executing tasks in parallel using Rayon...");
    
    // Use Arc<Mutex<>> to safely share task status across threads
    let tasks_with_status: Vec<Arc<Mutex<(Task, Option<String>)>>> = tasks
        .iter()
        .map(|task| Arc::new(Mutex::new((task.clone(), None))))
        .collect();
    
    // Execute tasks in parallel
    tasks_with_status.par_iter().for_each(|task_mutex| {
        let mut task_guard = task_mutex.lock().unwrap();
        let (task, error) = &mut *task_guard;
        
        println!("Starting task {}: {}", task.id, task.description);
        task.set_status(TaskStatus::Running);
        
        match task.execute() {
            Ok(_) => {
                println!("Task {} completed successfully", task.id);
                task.set_status(TaskStatus::Completed);
            },
            Err(e) => {
                let error_msg = format!("Task {} failed: {}", task.id, e);
                println!("{}", error_msg);
                task.set_status(TaskStatus::Failed(error_msg.clone()));
                *error = Some(error_msg);
            }
        }
    });
    
    // Collect errors
    let errors: Vec<String> = tasks_with_status
        .iter()
        .filter_map(|task_mutex| {
            let task_guard = task_mutex.lock().unwrap();
            task_guard.1.clone()
        })
        .collect();
    
    if !errors.is_empty() {
        return Err(CrewAIError::ExecutionError(
            format!("Multiple task execution failures: {}", errors.join(", "))
        ));
    }
    
    println!("Parallel task execution with Rayon completed.");
    Ok(())
}

// Thread-safe Tokio runtime for async execution
pub async fn execute_tasks_tokio(tasks: Vec<Task>) -> Result<()> {
    println!("Executing tasks concurrently using Tokio...");
    
    // Share tasks using Arc to avoid cloning
    let tasks = Arc::new(tasks);
    let task_statuses = Arc::new(Mutex::new(vec![TaskStatus::Pending; tasks.len()]));
    
    let handles = (0..tasks.len()).map(|i| {
        let tasks_ref = Arc::clone(&tasks);
        let statuses_ref = Arc::clone(&task_statuses);
        
        task::spawn(async move {
            let task = &tasks_ref[i];
            println!("Starting task {}: {}", task.id, task.description);
            
            // Update status to running
            {
                let mut statuses = statuses_ref.lock().unwrap();
                statuses[i] = TaskStatus::Running;
            }
            
            // Execute the task
            let result = task.execute();
            
            // Update status based on result
            {
                let mut statuses = statuses_ref.lock().unwrap();
                match &result {
                    Ok(_) => {
                        println!("Task {} completed successfully", task.id);
                        statuses[i] = TaskStatus::Completed;
                    },
                    Err(e) => {
                        let error_msg = format!("Task {} failed: {}", task.id, e);
                        println!("{}", error_msg);
                        statuses[i] = TaskStatus::Failed(error_msg);
                    }
                }
            }
            
            result.map_err(|e| format!("Task {} failed: {}", task.id, e))
        })
    }).collect::<Vec<_>>();
    
    let results = join_all(handles).await;
    
    // Collect any errors
    let errors: Vec<_> = results
        .into_iter()
        .filter_map(|r| match r {
            Ok(Ok(())) => None,
            Ok(Err(e)) => Some(e),
            Err(e) => Some(format!("Task panicked: {}", e)),
        })
        .collect();
    
    if !errors.is_empty() {
        return Err(CrewAIError::ExecutionError(
            format!("Multiple async task failures: {}", errors.join(", "))
        ));
    }
    
    println!("Concurrent task execution with Tokio completed.");
    Ok(())
} 