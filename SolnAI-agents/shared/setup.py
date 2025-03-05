from setuptools import setup, find_packages

setup(
    name="solnai-agent-utils",
    version="1.0.0",
    description="Shared utilities for SolnAI agents",
    author="SolnAI Team",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.95.0",
        "uvicorn>=0.21.0",
        "pydantic>=2.0.0",
        "supabase>=1.0.0",
        "python-dotenv>=1.0.0",
        "requests>=2.25.0",
        "httpx>=0.23.0",
        "openai>=0.27.0",
        "pytest>=6.2.5",
        "pytest-asyncio>=0.20.0",
    ],
    python_requires=">=3.11",
)
