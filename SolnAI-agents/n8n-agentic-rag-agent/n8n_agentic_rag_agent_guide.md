# N8N Agentic RAG Implementation Guide

## Name
n8n-agentic-rag-agent

## Description
The N8N Agentic RAG Agent is an advanced implementation of Retrieval Augmented Generation that goes beyond simple document lookups. Unlike standard RAG which only performs basic retrievals, this agent can reason about your knowledge base, self-improve retrieval strategies, and dynamically switch between different tools based on the specific question type. It excels at handling numerical analysis, connecting information across documents, and providing complete document context when needed, making it particularly valuable for complex research and analysis tasks that involve both text and tabular data.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The N8N Agentic RAG Agent uses workflow orchestration concepts similar to llm-chain through n8n's workflow system:

```javascript
// Conceptual representation of the workflow as an llm-chain
import { Chain, Step } from 'llm_chain';

function createAgenticRagChain(query, knowledgeBase) {
  const chain = Chain.new();
  
  // Step 1: Analyze the query to determine the best approach
  chain.step(Step.new("query_analysis", analyzeQueryType, {
    query: query,
    options: ["vector_search", "sql_query", "full_document"]
  }));
  
  // Step 2: Based on analysis, choose the appropriate retrieval strategy
  chain.step(Step.new("retrieval_strategy", chooseRetrievalStrategy, 
    depends_on=["query_analysis"]));
  
  // Step 3A: If vector search is best, perform embedding and similarity search
  chain.step(Step.new("vector_search", performVectorSearch, {
    knowledge_base: knowledgeBase,
    top_k: 5
  }, depends_on=["retrieval_strategy"], condition="strategy == 'vector_search'"));
  
  // Step 3B: If SQL is best (for numerical/tabular data), perform SQL query
  chain.step(Step.new("sql_query", performSqlQuery, {
    tables: knowledgeBase.tables,
    query_type: "analytical" 
  }, depends_on=["retrieval_strategy"], condition="strategy == 'sql_query'"));
  
  // Step 3C: If full document is best, retrieve entire document
  chain.step(Step.new("full_document", retrieveFullDocument, {
    documents: knowledgeBase.documents
  }, depends_on=["retrieval_strategy"], condition="strategy == 'full_document'"));
  
  // Step 4: Merge results from whichever retrieval strategy was used
  chain.step(Step.new("merge_results", mergeResults, 
    depends_on=["vector_search", "sql_query", "full_document"]));
  
  // Step 5: Generate final response based on retrieved information
  chain.step(Step.new("generate_response", generateResponse, {
    model: "gpt-4o",
    max_tokens: 2000
  }, depends_on=["merge_results"]));
  
  return chain.execute();
}
```

The actual implementation in n8n connects nodes in a visual workflow that accomplishes the same sequence of operations, handling the flow of data between different processing steps.

#### llguidance Integration
The agent uses llguidance concepts through structured prompt templates and output formatting:

```javascript
// Conceptual representation of prompt template and guidance
import { PromptTemplate, OutputFormatter } from 'llguidance';

// System message template for the AI agent
const systemMessageTemplate = PromptTemplate.fromTemplate(`
You are an advanced RAG agent with the ability to use multiple tools to answer questions about documents.
You have access to the following tools:
1. vector_search - Use this to find relevant text chunks in the document database
2. sql_query - Use this for numerical analysis on tabular data
3. full_document - Use this to retrieve and analyze entire documents

For each question, analyze what would be the best approach:
- Use vector_search for general information questions
- Use sql_query for numerical analysis, trends, or statistics
- Use full_document when context from an entire document is needed

Be thoughtful about your approach and explain your reasoning.
`);

// Template for query analysis
const queryAnalysisTemplate = PromptTemplate.fromTemplate(`
Analyze the following query and determine the best approach:

Query: {{query}}

Which tool would be most appropriate to answer this query effectively?
- vector_search
- sql_query
- full_document

Explain your reasoning for selecting this approach.
`);

// Output formatter for structured response
const responseFormatter = new OutputFormatter({
  schema: {
    type: "object",
    properties: {
      answer: { type: "string" },
      sources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string" },
            content: { type: "string" }
          }
        }
      },
      reasoning: { type: "string" },
      approach_used: { type: "string" }
    }
  }
});
```

In the n8n implementation, these concepts are represented through AI Agent nodes and database integration nodes with carefully crafted system messages and formatting logic.

#### aici Integration
While not explicitly implemented in the current version, aici concepts for real-time guidance could be integrated:

```javascript
// Conceptual implementation of aici in the agentic RAG context
async function ragWithAici(query, knowledgeBase) {
  // Start the analysis process
  await aici.FixedTokens(`Analyzing query: "${query}"\n`);
  
  // Determine the best approach
  await aici.FixedTokens("Determining the optimal retrieval strategy...\n");
  
  // Check if query is about numerical analysis
  if (query.includes("average") || query.includes("total") || query.includes("count") || 
      query.includes("statistics") || query.includes("compare")) {
    await aici.FixedTokens("Query involves numerical analysis. Using SQL query approach.\n");
    const sqlResult = await executeSqlQuery(query, knowledgeBase);
    await aici.FixedTokens(`SQL query executed. Found ${sqlResult.rowCount} rows of relevant data.\n`);
    return formatSqlResults(sqlResult);
  }
  
  // Check if query requires full document context
  else if (query.includes("entire document") || query.includes("full context") || 
           query.includes("complete picture") || query.includes("overview of")) {
    await aici.FixedTokens("Query requires full document context. Retrieving entire document.\n");
    const document = await retrieveFullDocument(query, knowledgeBase);
    await aici.FixedTokens(`Retrieved complete document: ${document.title}\n`);
    return summarizeDocument(document);
  }
  
  // Default to vector search for general information
  else {
    await aici.FixedTokens("Using vector search to find relevant information.\n");
    const searchResults = await performVectorSearch(query, knowledgeBase);
    
    await aici.FixedTokens(`Found ${searchResults.length} relevant passages.\n`);
    
    if (searchResults.length === 0) {
      await aici.FixedTokens("No results found. Broadening search criteria...\n");
      const broadenedResults = await performVectorSearch(query, knowledgeBase, {broadened: true});
      return formatSearchResults(broadenedResults);
    }
    
    return formatSearchResults(searchResults);
  }
}
```

### Architecture
The N8N Agentic RAG Agent uses a sophisticated workflow-based architecture with the following components:

1. **Document Processing Pipeline**:
   - File upload and detection
   - Document type identification (text vs. tabular)
   - Text chunking for vector storage
   - CSV/tabular data extraction for SQL storage

2. **Storage System**:
   - Vector database for text embeddings
   - JSONB in Supabase for tabular data
   - Document metadata storage

3. **Query Processing System**:
   - Query analysis for tool selection
   - Vector search for text information
   - SQL queries for numerical analysis
   - Full document retrieval for comprehensive context

4. **Response Generation**:
   - Retrieval augmented answer synthesis
   - Source attribution
   - Reasoning explanation

### Database Schema
```sql
-- Document metadata table
CREATE TABLE document_metadata (
  file_id TEXT PRIMARY KEY,
  file_title TEXT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_schema JSONB,
  summary TEXT,
  total_chunks INTEGER,
  file_size INTEGER
);

-- Document chunks for vector search
CREATE TABLE document_chunks (
  chunk_id SERIAL PRIMARY KEY,
  file_id TEXT REFERENCES document_metadata(file_id),
  chunk_index INTEGER,
  chunk_text TEXT,
  embedding VECTOR(1536),
  metadata JSONB
);

-- Tabular data storage using JSONB
CREATE TABLE document_rows (
  row_id SERIAL PRIMARY KEY,
  dataset_id TEXT REFERENCES document_metadata(file_id),
  row_index INTEGER,
  row_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector index for similarity search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Create indexes for efficient JSONB queries
CREATE INDEX idx_row_data ON document_rows USING gin (row_data);
CREATE INDEX idx_dataset_id ON document_rows(dataset_id);
```

### Performance Optimization
- **Intelligent Tool Selection**: Chooses the optimal retrieval strategy based on query type
- **JSONB Storage**: Uses efficient JSONB storage for tabular data without creating schema-specific tables
- **Vector Indexing**: Optimizes vector search with appropriate indexing
- **Query Planning**: Analyzes SQL queries for tabular data before execution
- **Response Caching**: Caches common queries and responses
- **Parallel Processing**: Handles multiple documents and queries in parallel workflows

### Ethical Considerations
- **Source Attribution**: Maintains clear provenance of information
- **Data Privacy**: Only processes documents explicitly uploaded by users
- **Reasoning Transparency**: Explains the retrieval and reasoning process
- **Result Verification**: Provides mechanisms for users to verify information against sources
- **Bias Mitigation**: Attempts to provide balanced information from multiple sources

## Example Usage

### Basic RAG Query
```javascript
// Example webhook request for a text-based query
fetch('https://your-n8n-instance.com/webhook/agentic-rag-query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: "What are the key features of the product described in the documentation?",
    user_id: "user-123",
    session_id: "session-789"
  })
})
.then(response => response.json())
.then(data => {
  console.log('Research results:', data);
})
.catch(error => console.error('Error:', error));
```

### Numerical Analysis Query
```javascript
// Example webhook request for a numerical analysis query
fetch('https://your-n8n-instance.com/webhook/agentic-rag-query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: "What was the average revenue per quarter last year according to the financial reports?",
    user_id: "user-123",
    session_id: "session-789"
  })
})
.then(response => response.json())
.then(data => {
  console.log('Analysis results:', data);
})
.catch(error => console.error('Error:', error));
```

### Example Response
```json
{
  "result": {
    "answer": "Based on the financial reports, the average quarterly revenue last year was $2.45 million. This represents a 12% increase compared to the previous year's average of $2.19 million. The highest performing quarter was Q4 with $2.78 million in revenue, while Q1 had the lowest performance at $2.12 million.",
    "sources": [
      {
        "title": "Annual Financial Report 2023.xlsx",
        "type": "tabular_data",
        "content": "SQL analysis of quarterly revenue data from rows 15-19"
      },
      {
        "title": "Q4 Earnings Call Transcript.pdf",
        "type": "text_chunk",
        "content": "Excerpt from page 3 discussing revenue performance"
      }
    ],
    "reasoning": "Since this question involved numerical analysis across tabular data, I used SQL queries to analyze the quarterly revenue figures from the financial reports. I complemented this with contextual information from the earnings call transcript to provide additional insights on performance trends.",
    "approach_used": "sql_query"
  }
}
```

### Document Upload
```javascript
// Example of document upload using the n8n workflow
// This is a simplified representation of the actual API call
fetch('https://your-n8n-instance.com/webhook/upload-document', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData // FormData containing the file to be processed
})
.then(response => response.json())
.then(data => {
  console.log('Document processed:', data);
})
.catch(error => console.error('Error:', error));
```

## Testing
The agent includes comprehensive testing considerations for:
- Document processing pipeline
- Query analysis accuracy
- Retrieval quality for different query types
- SQL query generation and execution
- Response quality and accuracy

Test scenarios should include:
1. Text-only documents (PDFs, Markdown, plain text)
2. Tabular data (CSV, Excel, Google Sheets)
3. Mixed document types
4. Questions requiring specific retrieval strategies
5. Edge cases like empty documents or highly technical content

## Future Enhancements
1. Multi-modal document support (images, diagrams, charts)
2. Advanced semantic search with query rewriting
3. Improved handling of citations and references
4. Interactive follow-up questions
5. Document relationship mapping
6. User feedback integration to improve retrieval quality
7. Custom vector stores beyond Supabase
8. Hierarchical document chunking strategies
