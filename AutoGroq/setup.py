import os
from setuptools import setup, find_packages

# Read the contents of the requirements file
with open(os.path.join(os.path.dirname(__file__), "requirements.txt")) as f:
    requirements = f.read().splitlines()

# Read the README file
with open(os.path.join(os.path.dirname(__file__), "README.md"), encoding="utf-8") as f:
    readme = f.read()

setup(
    name="autogroq",
    version="0.1.0",
    description="A sophisticated agent workflow system built on LangGraph for Groq LLMs",
    long_description=readme,
    long_description_content_type="text/markdown",
    author="SolnAI",
    author_email="info@soln.ai",
    url="https://github.com/Soln-AI/Soln-Agents",
    packages=find_packages(),
    include_package_data=True,
    install_requires=requirements,
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
    keywords="llm, agents, groq, langgraph, langchain",
)
