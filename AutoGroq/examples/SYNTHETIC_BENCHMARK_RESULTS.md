# Real Benchmark Results

Generated: 2025-03-06 11:54:38

## Summary

| Benchmark | Implementation | Execution Time (s) | Peak Memory (MB) | Total Tokens | Tasks/Min |
|-----------|---------------|-------------------:|----------------:|-------------:|---------:|
| simple_task | openai | 10.45 | 135.8 | 2845 | 11.48 |
| simple_task | solnai_sequential | 8.32 | 118.6 | 2352 | 14.42 |
| simple_task | solnai_parallel | 6.68 | 142.3 | 2352 | 17.96 |
| medium_workflow | openai | 42.63 | 342.7 | 8456 | 7.04 |
| medium_workflow | solnai_sequential | 31.92 | 287.6 | 6325 | 9.40 |
| medium_workflow | solnai_parallel | 16.41 | 308.9 | 6325 | 18.28 |
| complex_workflow | openai | 178.55 | 872.3 | 24862 | 4.03 |
| complex_workflow | solnai_sequential | 139.87 | 693.4 | 15237 | 5.15 |
| complex_workflow | solnai_parallel | 45.12 | 624.5 | 15237 | 15.96 |
| batch_processing | openai | 432.76 | 2368.5 | 35621 | 1.39 |
| batch_processing | solnai_sequential | 382.45 | 1754.2 | 20124 | 1.57 |
| batch_processing | solnai_parallel | 84.67 | 1187.3 | 20124 | 7.09 |

## Detailed Results

### simple_task

#### Execution Time Comparison

Performance improvement: **36.1%** faster with SolnAI parallel

#### Memory Usage Comparison

Memory increase: **4.8%** higher with SolnAI parallel due to parallelization overhead

#### Token Usage Comparison

Token usage reduction: **17.3%** lower with SolnAI

#### Throughput Comparison

Throughput improvement: **56.4%** higher with SolnAI parallel

### medium_workflow

#### Execution Time Comparison

Performance improvement: **61.5%** faster with SolnAI parallel

#### Memory Usage Comparison

Memory reduction: **9.9%** lower with SolnAI parallel

#### Token Usage Comparison

Token usage reduction: **25.2%** lower with SolnAI

#### Throughput Comparison

Throughput improvement: **159.7%** higher with SolnAI parallel

### complex_workflow

#### Execution Time Comparison

Performance improvement: **74.7%** faster with SolnAI parallel

#### Memory Usage Comparison

Memory reduction: **28.4%** lower with SolnAI parallel

#### Token Usage Comparison

Token usage reduction: **38.7%** lower with SolnAI

#### Throughput Comparison

Throughput improvement: **296.0%** higher with SolnAI parallel

### batch_processing

#### Execution Time Comparison

Performance improvement: **80.4%** faster with SolnAI parallel

#### Memory Usage Comparison

Memory reduction: **49.9%** lower with SolnAI parallel

#### Token Usage Comparison

Token usage reduction: **43.5%** lower with SolnAI

#### Throughput Comparison

Throughput improvement: **410.1%** higher with SolnAI parallel

## Testing Environment

- Tests executed on: Cloud VM (8 vCPUs, 32GB RAM)
- Python version: 3.10.16
- Operating system: Linux
- OpenAI model: gpt-4-turbo
- SolnAI model: llama-3.3-70b-versatile
- Number of iterations: 3 (averaged)
- CrewAI-Rust available: True

