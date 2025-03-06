#!/bin/bash
# Install dependencies for performance optimizations

set -e  # Exit on error

echo "Installing dependencies for AutoGroq performance optimizations..."

# Core dependencies
pip install psutil matplotlib numpy

# Optional dependencies
pip install pympler memory_profiler

# Try to install CrewAI-Rust if available
echo "Attempting to install CrewAI-Rust..."
if [ -d "../crewai-rust" ]; then
    echo "CrewAI-Rust directory found, building from source..."
    
    cd ../crewai-rust
    
    # Build and install Rust components
    if command -v cargo &> /dev/null; then
        echo "Building CrewAI-Rust core..."
        cargo build --release
        
        # Build and install Python bindings
        if command -v maturin &> /dev/null; then
            echo "Building CrewAI-Rust Python bindings..."
            cd crewai-pyo3/
            maturin build --release
            pip install ./target/wheels/crewai_rust-*.whl
        else
            echo "Warning: maturin not found. Installing it..."
            pip install maturin
            echo "Building CrewAI-Rust Python bindings..."
            cd crewai-pyo3/
            maturin build --release
            pip install ./target/wheels/crewai_rust-*.whl
        fi
    else
        echo "Warning: cargo not found. Cannot build CrewAI-Rust."
        echo "Please install Rust from https://rustup.rs/ to use CrewAI-Rust optimizations."
    fi
    
    cd ../../AutoGroq
else
    echo "CrewAI-Rust directory not found. Skipping CrewAI-Rust installation."
    echo "For optimal performance, please clone the CrewAI-Rust repository and run this script again."
fi

# Create benchmark directory
mkdir -p ./benchmarks

echo "Installation completed!"
echo "Use the optimized components by importing from src.integrations.optimized_crewai_integration and src.workflows.optimized_workflow"