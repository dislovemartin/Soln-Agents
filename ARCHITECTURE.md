# SolnAI Architecture

This document provides an overview of the SolnAI system monitoring platform's repository structure, technology stack, and architectural decisions.

## Repository Structure

SolnAI is organized as a monorepo containing several interconnected components:

```
SolnAI/
├── .devcontainer/        # Development container configuration
├── .github/              # GitHub workflows and templates
├── SolnAI-agents/        # AI-powered monitoring agents
├── aici/                 # AI context integration components
├── browser-extension/    # Browser extension for dashboard access
├── cloud-deployments/    # Cloud deployment configurations
├── collector/            # System metrics and log collection services
├── crewai-rust/          # Agent orchestration engine
├── docker/               # Docker configuration files
├── docker-deployment/    # Docker deployment scripts
├── docs/                 # Documentation files
├── embed/                # Embedding components for metric analysis
├── frontend/             # Dashboard UI application (React/TypeScript)
├── images/               # Image assets
├── llguidance/           # AI guidance for anomaly detection
├── llm-chain/            # LLM chain for metric correlation
├── locales/              # Internationalization files
├── server/               # Backend server (Node.js)
├── storage/              # Time series data storage components
├── .env.example          # Example environment configuration
├── .gitignore            # Git ignore rules
├── package.json          # Root package configuration
└── README.md             # Project overview
```

## Component Overview

### Frontend

The frontend provides an intuitive dashboard interface for system monitoring, built with React and TypeScript.

Key features:
- Interactive metric visualization dashboards
- Real-time system status monitoring
- Customizable alert views
- Historical performance analysis tools
- Responsive design for desktop and mobile access

### Collector

The collector component is responsible for gathering system metrics, logs, and performance data from target systems with minimal overhead.

Key features:
- Lightweight agent deployment
- Multiple operating system support (Linux, Windows, macOS)
- Container monitoring (Docker, Kubernetes)
- Custom application metrics collection
- Log ingestion and processing

### Server

The server component provides the backend API and data processing engine for the SolnAI system, handling real-time metrics, anomaly detection, and alert management.

Key features:
- Node.js backend with scalable architecture
- RESTful API endpoints for data ingestion and retrieval
- Advanced anomaly detection algorithms
- Alert generation and management
- Time series database integration

### SolnAI Agents

The SolnAI-agents directory contains various AI agent implementations that perform specific monitoring and analytics tasks.

Examples include:
- Root cause analysis agents
- Predictive maintenance agents
- Capacity planning agents
- Security monitoring agents
- Performance optimization agents

### Vector Database Support

SolnAI uses vector databases for efficient pattern recognition and anomaly detection across system metrics:

- LanceDB (default)
- Chroma
- Pinecone
- Astra DB
- Weaviate

### LLM Integration for Analytics

SolnAI leverages multiple LLM providers to generate insights and recommendations from system data:

- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models)
- Azure OpenAI
- Local models via Ollama, LM Studio, LocalAI

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- D3.js for advanced data visualization
- Tailwind CSS
- React Hook Form
- Zod (for validation)

### Collector
- Lightweight agents written in Rust
- Protocol buffer serialization
- TLS encryption for secure data transfer
- Minimal resource footprint

### Backend
- Node.js
- Express
- TypeScript
- Time series databases (InfluxDB, Prometheus, etc.)
- Vector databases for pattern recognition

### Deployment
- Docker
- Docker Compose
- Kubernetes for large-scale deployments
- Cloud deployment options (AWS, GCP, Azure, etc.)

## Data Flow Architecture

1. **Data Collection**
   - Lightweight collectors deployed on target systems
   - Metrics gathered at configurable intervals
   - Logs collected and pre-processed
   - Data compressed and encrypted for transmission

2. **Data Ingestion**
   - Server receives encrypted data from collectors
   - Data validated and normalized
   - Time series data stored in appropriate databases
   - Initial anomaly detection performed

3. **Analysis Pipeline**
   - Historical trends analyzed
   - Pattern recognition using vector embeddings
   - AI-powered anomaly detection
   - Correlation analysis across systems

4. **Visualization & Alerting**
   - Real-time dashboards updated
   - Alerts generated based on thresholds and anomalies
   - Notification dispatched via configured channels
   - AI-generated insights and recommendations delivered

## Security Considerations

SolnAI is designed with security as a core principle:

- End-to-end encryption for all data in transit
- Role-based access control for all components
- Secure credential storage
- Audit logging of all system activities
- Compliance with industry security standards

## Scalability Design

The system is architected to scale from single-server deployments to global infrastructure:

- Horizontally scalable collector agents
- Load-balanced server components
- Distributed time-series database support
- Configurable data retention policies
- Tiered storage for optimal performance and cost

## Development Workflow

1. **Environment Setup**
   - Copy `.env.example` to `.env` and configure as needed
   - Install dependencies with `npm install` or `yarn`

2. **Local Development**
   - Start the frontend: `cd frontend && npm run dev`
   - Start the server: `cd server && npm run dev`
   - Start the collector: `cd collector && npm run dev`

3. **Docker Development**
   - Use `docker-compose up` to start all services

4. **Testing**
   - Run tests with `npm test` in respective directories

## Future Directions

- Enhanced integration with cloud provider monitoring APIs
- Expanded support for specialized infrastructure (IoT, edge computing)
- Advanced predictive maintenance capabilities
- ML-powered resource optimization recommendations
- Expanded compliance reporting templates

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to contribute to SolnAI.