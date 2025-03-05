#!/usr/bin/env python3
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="goose-tools",
    version="0.1.0",
    author="SolnAI",
    author_email="info@solnai.com",
    description="Goose Context Management Tools for optimizing LLM sessions",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/solnai/goose-tools",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "goose_tools": ["api/templates/*.html"],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "flask>=2.0.0",
        "flask-cors>=3.0.0",
        "requests>=2.25.0",
        "tiktoken>=0.4.0",
        "anthropic>=0.3.0; python_version>='3.8'",
        "beautifulsoup4>=4.9.0",
        "python-dateutil>=2.8.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.0.0",
            "black>=22.0.0",
            "flake8>=4.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "goose-tools=goose_tools.cli:main",
            "goose-extract-web=goose_tools.scripts.extract_web:main",
            "goose-extract-code=goose_tools.scripts.extract_code:main",
            "goose-clean-sessions=goose_tools.scripts.clean_sessions:main",
        ],
    },
)