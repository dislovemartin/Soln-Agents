# Data Analysis Agent Implementation Guide

## Overview

The Data Analysis Agent is an intelligent assistant that specializes in analyzing data, generating insights, creating visualizations, and providing data-driven recommendations. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The Data Analysis Agent requires a sophisticated multi-step workflow to process and analyze data effectively. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def data_analysis_chain(data_source, analysis_type="comprehensive"):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("load_data", load_data_from_source, 
             config={"handle_missing": True, "infer_types": True, "sample_size": 10000}),
        
        Step("validate_data", validate_data_quality, 
             depends_on=["load_data"],
             config={"outlier_detection": True, "null_threshold": 0.2}),
        
        Step("clean_data", clean_and_preprocess_data, 
             depends_on=["validate_data"],
             config={"imputation_strategy": "smart", "normalize_numeric": True}),
        
        Step("explore_data", perform_exploratory_analysis, 
             depends_on=["clean_data"],
             config={"correlation_threshold": 0.7, "generate_histograms": True}),
        
        Step("statistical_analysis", run_statistical_tests, 
             depends_on=["explore_data"],
             config={"significance_level": 0.05, "test_normality": True}),
        
        Step("feature_engineering", engineer_features, 
             depends_on=["clean_data"],
             config={"auto_encoding": True, "interaction_terms": True}),
        
        Step("model_selection", select_appropriate_models, 
             depends_on=["statistical_analysis", "feature_engineering"],
             config={"model_types": ["regression", "classification", "clustering"], 
                     "cross_validation": True}),
        
        Step("train_models", train_and_evaluate_models, 
             depends_on=["model_selection"],
             config={"hyperparameter_tuning": True, "evaluation_metrics": ["accuracy", "f1", "rmse"]}),
        
        Step("generate_visualizations", create_data_visualizations, 
             depends_on=["explore_data", "statistical_analysis", "train_models"],
             config={"plot_types": ["scatter", "bar", "heatmap", "box"], "interactive": True}),
        
        Step("interpret_results", interpret_model_results, 
             depends_on=["train_models"],
             config={"feature_importance": True, "partial_dependence": True}),
        
        Step("generate_insights", extract_key_insights, 
             depends_on=["interpret_results", "generate_visualizations"],
             config={"insight_count": 5, "actionable_only": True}),
        
        Step("compile_report", compile_analysis_report, 
             depends_on=["generate_insights"],
             config={"format": "markdown", "include_code": True, "include_methodology": True})
    ]
    
    # Customize steps based on analysis type
    if analysis_type == "exploratory":
        steps = steps[:5] + [steps[-2], steps[-1]]  # Only exploratory steps
    elif analysis_type == "predictive":
        steps = [steps[0], steps[1], steps[2], steps[5], steps[6], steps[7], steps[9], steps[10], steps[11]]
    elif analysis_type == "visual":
        steps = [steps[0], steps[1], steps[2], steps[3], steps[8], steps[10], steps[11]]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=3, max_concurrency=4)
    return chain.execute(data_source=data_source)
```

### 2. llguidance Implementation

The Data Analysis Agent needs to ensure structured outputs for analysis reports, code snippets, and visualizations. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for analysis report with optimal constraints
report_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "title": { 
      "type": "string",
      "minLength": 10,
      "maxLength": 100
    },
    "summary": { 
      "type": "string",
      "minLength": 100,
      "maxLength": 500
    },
    "methodology": {
      "type": "object",
      "properties": {
        "data_source": { "type": "string" },
        "preprocessing_steps": {
          "type": "array",
          "items": { "type": "string" }
        },
        "analysis_techniques": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["data_source", "preprocessing_steps", "analysis_techniques"]
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "significance": { 
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "supporting_data": { "type": "string" }
        },
        "required": ["title", "description", "significance"]
      },
      "minItems": 3
    },
    "visualizations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "type": { 
            "type": "string",
            "enum": ["bar_chart", "scatter_plot", "heatmap", "line_chart", "histogram", "box_plot", "pie_chart"]
          },
          "code": { "type": "string" }
        },
        "required": ["title", "description", "type", "code"]
      }
    },
    "recommendations": {
      "type": "array",
      "items": { 
        "type": "string",
        "minLength": 20,
        "maxLength": 200
      },
      "minItems": 2,
      "maxItems": 5
    },
    "code_snippets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "purpose": { "type": "string" },
          "language": { 
            "type": "string",
            "enum": ["python", "r", "sql"]
          },
          "code": { "type": "string" }
        },
        "required": ["purpose", "language", "code"]
      }
    }
  },
  "required": ["title", "summary", "findings", "recommendations"]
}
""")

# Define the grammar for Python code snippets
python_code_grammar = Grammar("""
python_code ::= import_statements setup_code analysis_code visualization_code
import_statements ::= import_statement+
import_statement ::= /^import\s+[a-zA-Z0-9_]+(\s+as\s+[a-zA-Z0-9_]+)?$|^from\s+[a-zA-Z0-9_.]+\s+import\s+[a-zA-Z0-9_*,\s]+$/
setup_code ::= comment? variable_assignment*
comment ::= /^#\s+.*$/
variable_assignment ::= /^[a-zA-Z0-9_]+\s*=\s*.+$/
analysis_code ::= function_call+
function_call ::= /^[a-zA-Z0-9_.]+\([^)]*\)$/
visualization_code ::= plotting_function
plotting_function ::= /^(plt|sns|px)\.[a-zA-Z0-9_]+\([^)]*\)$|^[a-zA-Z0-9_]+\.plot\([^)]*\)$/
""")

# Define the grammar for SQL queries
sql_grammar = Grammar("""
sql_query ::= select_statement
select_statement ::= /^SELECT\s+.+\s+FROM\s+.+(\s+WHERE\s+.+)?(\s+GROUP\s+BY\s+.+)?(\s+HAVING\s+.+)?(\s+ORDER\s+BY\s+.+)?(\s+LIMIT\s+[0-9]+)?$/i
""")

# Apply the schemas to constrain the LLM output
def generate_analysis_outputs(analysis_results, data_info):
    # Generate analysis report with structured output
    report_prompt = f"Create a comprehensive data analysis report based on these results: {analysis_results}"
    report = llm.generate(report_prompt, grammar=report_schema)
    
    # Generate Python code snippets with proper syntax
    code_prompt = f"Write Python code to analyze this data: {data_info}"
    code_snippets = llm.generate(code_prompt, grammar=python_code_grammar)
    
    # Generate SQL queries if needed
    sql_prompt = f"Write SQL queries to extract insights from this data: {data_info}"
    sql_queries = llm.generate(sql_prompt, grammar=sql_grammar)
    
    return {
        "report": report,
        "code_snippets": code_snippets,
        "sql_queries": sql_queries
    }
```

### 3. aici Implementation

The Data Analysis Agent needs fine-grained control over token generation for analysis reports and code generation. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import random

async def analyze_data(data_source, analysis_type="comprehensive"):
    # Load and analyze data with external tools
    data_info = await aici.call_external_api(
        "data_processor",
        {"source": data_source, "analysis_type": analysis_type},
        timeout=10000,
        retry_count=2
    )
    
    # Initialize with data summary
    await aici.FixedTokens(f"# Data Analysis Report: {data_info['title']}\n\n")
    await aici.FixedTokens(f"## Data Summary\n\n")
    await aici.FixedTokens(f"- Source: {data_info['source']}\n")
    await aici.FixedTokens(f"- Rows: {data_info['row_count']}\n")
    await aici.FixedTokens(f"- Columns: {data_info['column_count']}\n")
    await aici.FixedTokens(f"- Data types: {', '.join(data_info['data_types'])}\n\n")
    
    # Generate executive summary
    await aici.FixedTokens("## Executive Summary\n\n")
    summary_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n", max_tokens=300)
    
    # Generate methodology section
    await aici.FixedTokens("## Methodology\n\n")
    methodology_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n", max_tokens=400)
    
    # Generate key findings with controlled structure
    await aici.FixedTokens("## Key Findings\n\n")
    findings_marker = aici.Label()
    
    # Generate 3-5 findings based on data complexity
    finding_count = min(5, max(3, int(data_info['complexity_score'] * 5)))
    
    for i in range(finding_count):
        await aici.FixedTokens(f"### Finding {i+1}: ")
        await aici.gen_text(stop_at="\n", max_tokens=100)
        await aici.gen_text(stop_at="\n\n", max_tokens=300)
    
    # Generate visualizations section with code
    await aici.FixedTokens("## Visualizations\n\n")
    visualizations_marker = aici.Label()
    
    # Generate 2-4 visualizations based on data types
    viz_types = select_visualization_types(data_info['data_types'])
    
    for i, viz_type in enumerate(viz_types):
        await aici.FixedTokens(f"### Visualization {i+1}: {viz_type.title()} Chart\n\n")
        await aici.gen_text(stop_at="\n\n", max_tokens=150)
        
        # Generate Python code for the visualization
        await aici.FixedTokens("```python\n")
        await aici.FixedTokens("import pandas as pd\n")
        await aici.FixedTokens("import matplotlib.pyplot as plt\n")
        await aici.FixedTokens("import seaborn as sns\n\n")
        
        # Generate visualization code based on type
        if viz_type == "scatter":
            await aici.FixedTokens(f"# Create scatter plot\nplt.figure(figsize=(10, 6))\nsns.scatterplot(data=df, x='{data_info['numeric_columns'][0]}', y='{data_info['numeric_columns'][1]}'")
            await aici.gen_text(stop_at="\n", max_tokens=100)
        elif viz_type == "bar":
            await aici.FixedTokens(f"# Create bar chart\nplt.figure(figsize=(12, 6))\nsns.barplot(data=df, x='{data_info['categorical_columns'][0]}', y='{data_info['numeric_columns'][0]}'")
            await aici.gen_text(stop_at="\n", max_tokens=100)
        else:
            await aici.gen_text(stop_at="\n", max_tokens=200)
        
        await aici.FixedTokens("\nplt.title('")
        await aici.gen_text(stop_at="'", max_tokens=50)
        await aici.FixedTokens("')\nplt.tight_layout()\nplt.show()\n```\n\n")
    
    # Generate statistical analysis section
    await aici.FixedTokens("## Statistical Analysis\n\n")
    stats_marker = aici.Label()
    await aici.gen_text(stop_at="\n\n", max_tokens=500)
    
    # Generate code snippets for analysis
    await aici.FixedTokens("## Analysis Code\n\n")
    await aici.FixedTokens("```python\n")
    await aici.FixedTokens("import pandas as pd\nimport numpy as np\nfrom scipy import stats\n\n")
    await aici.FixedTokens(f"# Load the data\ndf = pd.read_csv('{data_source}')\n\n")
    await aici.FixedTokens("# Perform data cleaning\n")
    await aici.gen_text(stop_at="\n\n", max_tokens=200)
    await aici.FixedTokens("\n# Perform analysis\n")
    await aici.gen_text(stop_at="\n\n", max_tokens=300)
    await aici.FixedTokens("\n# Generate statistics\n")
    await aici.gen_text(stop_at="\n", max_tokens=200)
    await aici.FixedTokens("\n```\n\n")
    
    # Generate recommendations
    await aici.FixedTokens("## Recommendations\n\n")
    recommendations_marker = aici.Label()
    
    for i in range(3):
        await aici.FixedTokens(f"{i+1}. ")
        await aici.gen_text(stop_at="\n", max_tokens=150)
        await aici.FixedTokens("\n")
    
    # Store the generated content with optimal variable names
    aici.set_var("summary", summary_marker.text_since())
    aici.set_var("methodology", methodology_marker.text_since())
    aici.set_var("findings", findings_marker.text_since())
    aici.set_var("visualizations", visualizations_marker.text_since())
    aici.set_var("recommendations", recommendations_marker.text_since())

# Helper function to select appropriate visualization types
def select_visualization_types(data_types):
    viz_types = []
    if "numeric" in data_types and len(data_types) > 1:
        viz_types.append("scatter")
    if "categorical" in data_types:
        viz_types.append("bar")
    if "temporal" in data_types:
        viz_types.append("line")
    if "numeric" in data_types:
        viz_types.append("histogram")
    
    # Select 2-4 visualization types
    return random.sample(viz_types, min(4, max(2, len(viz_types))))

# Start the aici controller with optimal timeout
aici.start(analyze_data(data_source, analysis_type), timeout=120000)
```

## Integration and Optimization

To integrate all three modules for the Data Analysis Agent:

```python
def data_analysis_agent(data_source, analysis_type="comprehensive"):
    # 1. Use llm-chain for the overall workflow
    analysis_results = data_analysis_chain(data_source, analysis_type)
    
    # Extract data information for further processing
    data_info = {
        "source": data_source,
        "row_count": analysis_results["load_data"]["row_count"],
        "column_count": analysis_results["load_data"]["column_count"],
        "data_types": analysis_results["load_data"]["data_types"],
        "numeric_columns": analysis_results["load_data"]["numeric_columns"],
        "categorical_columns": analysis_results["load_data"]["categorical_columns"],
        "complexity_score": analysis_results["explore_data"]["complexity_score"]
    }
    
    # 2. Apply llguidance constraints to ensure proper formatting
    formatted_outputs = generate_analysis_outputs(analysis_results, data_info)
    
    # 3. Use aici for final output generation with precise control
    final_output = aici.run(
        analyze_data,
        data_source=data_source,
        analysis_type=analysis_type,
        context={
            "data_info": data_info,
            "analysis_results": analysis_results,
            "formatted_outputs": formatted_outputs
        },
        max_tokens=8000,
        temperature=0.4
    )
    
    return final_output
```

## Optimal Configuration Values

For the Data Analysis Agent, the following configuration values are optimal:

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `batch_size` | 3 | Balances memory usage with processing efficiency for data operations |
| `max_concurrency` | 4 | Optimal for parallel data processing tasks |
| `sample_size` | 10000 | Large enough for statistical validity without excessive memory usage |
| `null_threshold` | 0.2 | Tolerates up to 20% missing values before requiring intervention |
| `correlation_threshold` | 0.7 | Identifies strong correlations without excessive noise |
| `significance_level` | 0.05 | Standard statistical significance level |
| `insight_count` | 5 | Provides sufficient insights without overwhelming the user |
| `finding_count` | Based on complexity | Adapts to data complexity (3-5 findings) |
| `temperature` | 0.4 | Lower temperature for more precise, factual analysis |
| `max_tokens` | 8000 | Sufficient for comprehensive analysis reports |
| `timeout` | 120000 | Allows for complex data processing (2 minutes) |

## Conclusion

This implementation guide provides a comprehensive approach to implementing the SolnAI core modules for the Data Analysis Agent. By following these guidelines and using the optimal configuration values, you can create a powerful data analysis tool that generates valuable insights, visualizations, and recommendations from various data sources. 