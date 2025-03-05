# Implementation Guide: Integrating SolnAI Core Modules with Agents

This guide explains how to implement the core SolnAI modules (`llm-chain`, `llguidance`, and `aici`) for specific tasks in each agent within the SolnAI-agents directory.

## Understanding the Core Modules

### 1. llm-chain

**Purpose**: Orchestrates complex flows when working with large language models by chaining multiple processing steps.

**Key Features**:
- Written in Rust (as seen in the Cargo.toml)
- Provides a framework for sequential processing of LLM inputs and outputs
- Manages the flow of data between different processing steps
- Handles dependencies between steps in a chain

**Use Cases**:
- Multi-step reasoning
- Breaking long documents into parts
- Sequential summarization
- Decision-making workflows

### 2. llguidance

**Purpose**: Enforces constraints on LLM outputs through constrained decoding.

**Key Features**:
- Implements constrained decoding for LLMs
- Enforces arbitrary context-free grammar on LLM outputs
- Supports JSON schemas, regular expressions, and context-free grammars
- Fast processing (approximately 50μs of CPU time per token)
- Can be used from Rust, C/C++, and Python

**Use Cases**:
- Ensuring outputs follow specific formats (JSON, XML, etc.)
- Enforcing structured outputs
- Limiting vocabulary or patterns in generated text
- Guiding the model to produce specific types of content

### 3. aici (Artificial Intelligence Controller Interface)

**Purpose**: Provides an interface for building controllers that constrain and direct LLM output in real-time.

**Key Features**:
- Controllers are implemented as WebAssembly (Wasm) modules
- Allows custom logic during token-by-token decoding
- Maintains state during an LLM request
- Supports programmatic or query-based decoding
- Integrates with various LLM backends (llama.cpp, HuggingFace Transformers, rLLM)

**Use Cases**:
- Dynamic editing of prompts and generated text
- Coordinating execution across multiple, parallel generations
- Implementing custom decoding strategies
- Building multi-agent conversations

## Implementation for Specific Agents

### YouTube Educator Plus Agent

This agent takes a YouTube link and generates educational materials like fill-in-the-blank notes, quizzes, and resources.

#### llm-chain Implementation:
```python
# Import the llm-chain module
from llm_chain import Chain, Step

# Define the processing steps
steps = [
    Step("extract_transcript", extract_youtube_transcript),
    Step("segment_content", segment_transcript_by_topics),
    Step("generate_notes", generate_fill_in_blank_notes, depends_on=["segment_content"]),
    Step("generate_quiz", generate_quiz_questions, depends_on=["segment_content"]),
    Step("find_resources", find_additional_resources, depends_on=["segment_content"]),
    Step("compile_pdf", compile_to_pdf, depends_on=["generate_notes", "generate_quiz", "find_resources"])
]

# Create and execute the chain
youtube_educator_chain = Chain(steps)
result = youtube_educator_chain.execute(youtube_url=input_url)
```

#### llguidance Implementation:
```python
# Import the llguidance module
from llguidance import Grammar, JSONSchema

# Define the schema for quiz questions
quiz_schema = JSONSchema("""
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "question": { "type": "string" },
      "options": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 4,
        "maxItems": 4
      },
      "correct_answer": { "type": "integer", "minimum": 0, "maximum": 3 }
    },
    "required": ["question", "options", "correct_answer"]
  },
  "minItems": 5,
  "maxItems": 10
}
""")

# Apply the schema to constrain the LLM output
def generate_quiz_questions(content):
    prompt = f"Create a quiz based on this content: {content}"
    return llm.generate(prompt, grammar=quiz_schema)
```

#### aici Implementation:
```python
# Import the aici module
import pyaici.server as aici

async def process_youtube_video(youtube_url):
    # Extract video ID and fetch metadata
    video_id = extract_video_id(youtube_url)
    metadata = await aici.call_external_api(f"https://www.googleapis.com/youtube/v3/videos?id={video_id}&part=snippet")
    
    # Generate educational content with controlled output
    await aici.FixedTokens(f"Creating educational materials for: {metadata['title']}\n")
    
    # Generate notes with specific formatting
    await aici.FixedTokens("## Fill-in-the-blank Notes\n\n")
    notes_marker = aici.Label()
    await aici.gen_text(stop_at="## Quiz")
    
    # Generate quiz with controlled format
    await aici.FixedTokens("## Quiz\n\n")
    quiz_marker = aici.Label()
    
    for i in range(1, 6):
        await aici.FixedTokens(f"{i}. ")
        await aici.gen_text(stop_at="\n")
        await aici.FixedTokens("   a. ")
        await aici.gen_text(stop_at="\n")
        await aici.FixedTokens("   b. ")
        await aici.gen_text(stop_at="\n")
        await aici.FixedTokens("   c. ")
        await aici.gen_text(stop_at="\n")
        await aici.FixedTokens("   d. ")
        await aici.gen_text(stop_at="\n\n")
    
    # Store the generated content
    aici.set_var("notes", notes_marker.text_since())
    aici.set_var("quiz", quiz_marker.text_since())

aici.start(process_youtube_video(youtube_url))
```

### Tweet Generator Agent

This agent generates Twitter/X posts based on user input or trending topics.

#### llm-chain Implementation:
```python
# Import the llm-chain module
from llm_chain import Chain, Step

# Define the processing steps
steps = [
    Step("fetch_trends", fetch_trending_topics),
    Step("research_content", research_topic_details, depends_on=["fetch_trends"]),
    Step("generate_drafts", generate_tweet_drafts, depends_on=["research_content"]),
    Step("optimize_engagement", optimize_for_engagement, depends_on=["generate_drafts"]),
    Step("schedule_posts", schedule_for_optimal_time, depends_on=["optimize_engagement"])
]

# Create and execute the chain
tweet_generator_chain = Chain(steps)
result = tweet_generator_chain.execute(topic=user_input_topic)
```

#### llguidance Implementation:
```python
# Import the llguidance module
from llguidance import Grammar, RegEx

# Define the grammar for tweets
tweet_grammar = Grammar("""
tweet ::= text hashtags?
text ::= /^.{1,240}$/
hashtags ::= /(\s#[a-zA-Z0-9]+){1,5}/
""")

# Apply the grammar to constrain the LLM output
def generate_tweet_drafts(topic, research):
    prompt = f"Write an engaging tweet about {topic}. Here's some context: {research}"
    return llm.generate(prompt, grammar=tweet_grammar)
```

#### aici Implementation:
```python
# Import the aici module
import pyaici.server as aici

async def generate_tweet(topic):
    # Research the topic
    research_data = await aici.call_external_api(f"https://api.brave.com/search?q={topic}")
    
    # Generate tweet with character limit control
    await aici.FixedTokens(f"Write an engaging tweet about {topic}.\n\n")
    
    tweet_marker = aici.Label()
    
    # Control the tweet generation
    await aici.gen_text(max_tokens=50)  # Limit to approximately 280 chars
    
    # Check if hashtags are needed
    if len(tweet_marker.text_since()) < 240:
        await aici.FixedTokens("\n\nHashtags: ")
        await aici.gen_text(stop_at="\n", max_tokens=5)
    
    # Store the generated tweet
    aici.set_var("tweet", tweet_marker.text_since())

aici.start(generate_tweet(user_topic))
```

### Research Agent

This agent performs in-depth research on topics and generates comprehensive reports.

#### llm-chain Implementation:
```python
# Import the llm-chain module
from llm_chain import Chain, Step

# Define the processing steps
steps = [
    Step("analyze_query", analyze_research_query),
    Step("identify_sources", identify_reliable_sources, depends_on=["analyze_query"]),
    Step("gather_information", gather_information_from_sources, depends_on=["identify_sources"]),
    Step("synthesize_findings", synthesize_research_findings, depends_on=["gather_information"]),
    Step("format_report", format_research_report, depends_on=["synthesize_findings"]),
    Step("add_citations", add_proper_citations, depends_on=["format_report", "identify_sources"])
]

# Create and execute the chain
research_chain = Chain(steps)
result = research_chain.execute(query=research_question)
```

#### llguidance Implementation:
```python
# Import the llguidance module
from llguidance import Grammar, JSONSchema

# Define the schema for research report sections
report_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "abstract": { "type": "string" },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "heading": { "type": "string" },
          "content": { "type": "string" },
          "subsections": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "subheading": { "type": "string" },
                "content": { "type": "string" }
              },
              "required": ["subheading", "content"]
            }
          }
        },
        "required": ["heading", "content"]
      },
      "minItems": 3
    },
    "conclusion": { "type": "string" },
    "references": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  },
  "required": ["title", "abstract", "sections", "conclusion", "references"]
}
""")

# Apply the schema to constrain the LLM output
def format_research_report(findings):
    prompt = f"Create a structured research report based on these findings: {findings}"
    return llm.generate(prompt, grammar=report_schema)
```

#### aici Implementation:
```python
# Import the aici module
import pyaici.server as aici

async def conduct_research(query):
    # Break down the research query
    await aici.FixedTokens(f"Research query: {query}\n\nBreaking down into sub-questions:\n")
    
    # Generate sub-questions
    sub_questions = []
    for i in range(1, 4):
        await aici.FixedTokens(f"{i}. ")
        question_marker = aici.Label()
        await aici.gen_text(stop_at="\n")
        sub_questions.append(question_marker.text_since())
    
    # Research each sub-question
    findings = []
    for i, question in enumerate(sub_questions):
        search_results = await aici.call_external_api(f"https://api.brave.com/search?q={question}")
        
        await aici.FixedTokens(f"\n\nFindings for question {i+1}: {question}\n")
        finding_marker = aici.Label()
        await aici.gen_text(stop_at="\n\n", context=search_results)
        findings.append(finding_marker.text_since())
    
    # Generate the final report with structured sections
    await aici.FixedTokens("\n\n# Research Report\n\n## Abstract\n")
    await aici.gen_text(stop_at="\n\n")
    
    for i, finding in enumerate(findings):
        await aici.FixedTokens(f"\n\n## Section {i+1}: {sub_questions[i]}\n")
        await aici.gen_text(stop_at="\n\n", context=finding)
    
    await aici.FixedTokens("\n\n## Conclusion\n")
    await aici.gen_text(stop_at="\n\n")
    
    await aici.FixedTokens("\n\n## References\n")
    for i in range(1, 6):
        await aici.FixedTokens(f"{i}. ")
        await aici.gen_text(stop_at="\n")

aici.start(conduct_research(research_query))
```

## General Integration Pattern

For any agent in the SolnAI-agents directory, you can follow this general pattern to implement the three core modules:

```python
# Import the necessary modules
from llm_chain import Chain, Step
from llguidance import Grammar, JSONSchema, RegEx
import pyaici.server as aici

# 1. Define the processing steps using llm-chain
steps = [
    Step("step1", function1),
    Step("step2", function2, depends_on=["step1"]),
    # Add more steps as needed
]
processing_chain = Chain(steps)

# 2. Define constraints using llguidance
output_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    // Define your schema properties here
  },
  "required": ["property1", "property2"]
}
""")

# 3. Define the aici controller for real-time control
async def agent_controller(input_data):
    # Initialize with fixed tokens
    await aici.FixedTokens(f"Processing input: {input_data}\n\n")
    
    # Set markers for different sections
    section1_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n")
    
    # Control the generation with fixed tokens
    await aici.FixedTokens("\nNext section:\n")
    section2_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n")
    
    # Store the generated content
    aici.set_var("section1", section1_marker.text_since())
    aici.set_var("section2", section2_marker.text_since())

# 4. Integrate all components in the main function
def process_agent_request(input_data):
    # Use llm-chain for the overall workflow
    chain_result = processing_chain.execute(input=input_data)
    
    # Apply llguidance constraints to the output
    constrained_output = llm.generate(
        prompt=f"Generate output based on: {chain_result}",
        grammar=output_schema
    )
    
    # Use aici for real-time control of the final output
    aici.start(agent_controller(constrained_output))
    
    return final_result
```

## Conclusion

By implementing these three core modules (llm-chain, llguidance, and aici) for each agent in the SolnAI-agents directory, you can create powerful, flexible, and controlled AI agents that perform specific tasks with high precision and reliability.

Each module serves a distinct purpose:
- **llm-chain**: Manages the overall workflow and processing steps
- **llguidance**: Ensures outputs follow specific formats and constraints
- **aici**: Provides real-time control over token generation

Together, these modules form a comprehensive framework for building sophisticated AI agents that can handle complex tasks while maintaining control over the output quality and format. 