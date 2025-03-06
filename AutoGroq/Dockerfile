# Base image with Python and Rust
FROM python:3.10-slim as base

# Set working directory
WORKDIR /app

# Install Rust toolchain
RUN apt-get update && \
    apt-get install -y curl build-essential gcc pkg-config libssl-dev && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    rm -rf /var/lib/apt/lists/*

# Add Cargo to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install maturin for building Python extensions
RUN pip install --no-cache-dir maturin

# Copy CrewAI-Rust for building
COPY crewai-rust /app/crewai-rust

# Build CrewAI-Rust
RUN cd /app/crewai-rust && \
    cargo build --release && \
    cd crewai-pyo3 && \
    maturin build --release && \
    pip install target/wheels/crewai_rust-*.whl

# Create a new stage for the final image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy Python package from the previous stage
COPY --from=base /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Install dependencies
COPY AutoGroq/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy AutoGroq code
COPY AutoGroq /app/

# Create necessary directories
RUN mkdir -p /app/logs /app/data

# Set environment variables
ENV PYTHONPATH=/app

# Expose API port
EXPOSE 8000

# Set default command
CMD ["python", "main.py"]
