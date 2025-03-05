# Ask Reddit Agent Implementation Guide

## Overview

The Ask Reddit Agent is designed to search Reddit for relevant posts and comments, extract insights, and present them in a structured format. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The Ask Reddit Agent requires a robust workflow to search Reddit, process posts and comments, and extract insights. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def ask_reddit_chain(query, max_posts=5, max_comments_per_post=10, sort_by="relevance"):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("formulate_search_query", optimize_reddit_search_query, 
             config={"add_reddit_keywords": True, "focus_on_question_format": True}),
        
        Step("search_web", search_web_for_reddit_posts, 
             depends_on=["formulate_search_query"],
             config={"search_engine": "brave", "filter_to_reddit": True, "max_results": 15}),
        
        Step("filter_reddit_posts", filter_relevant_reddit_posts, 
             depends_on=["search_web"],
             config={"relevance_threshold": 0.7, "max_posts": max_posts, "exclude_nsfw": True}),
        
        Step("extract_post_data", extract_post_content_and_metadata, 
             depends_on=["filter_reddit_posts"],
             config={"include_post_text": True, "include_upvotes": True, "include_awards": True}),
        
        Step("fetch_comments", fetch_top_comments, 
             depends_on=["extract_post_data"],
             config={"sort_by": "top", "max_comments": max_comments_per_post, "min_upvotes": 5}),
        
        Step("analyze_sentiment", analyze_comment_sentiment, 
             depends_on=["fetch_comments"],
             config={"sentiment_scale": [-1, 1], "identify_controversial": True}),
        
        Step("extract_insights", extract_key_insights_from_comments, 
             depends_on=["fetch_comments", "analyze_sentiment"],
             config={"insight_types": ["advice", "experience", "opinion", "fact"], 
                     "min_confidence": 0.6}),
        
        Step("rank_insights", rank_insights_by_relevance_and_upvotes, 
             depends_on=["extract_insights"],
             config={"prioritize_upvotes": True, "prioritize_relevance": True, 
                     "balance_factor": 0.7}),
        
        Step("format_response", format_reddit_insights_response, 
             depends_on=["rank_insights"],
             config={"format": "markdown", "include_citations": True, 
                     "include_upvote_counts": True, "include_subreddit_info": True})
    ]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=3)
    
    # Prepare input data
    input_data = {
        "query": query,
        "max_posts": max_posts,
        "max_comments_per_post": max_comments_per_post,
        "sort_by": sort_by
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The Ask Reddit Agent needs to ensure responses follow a specific format with proper citations and structured insights. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for Reddit search results
reddit_result_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "posts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "url": {
            "type": "string",
            "format": "uri"
          },
          "subreddit": {
            "type": "string",
            "pattern": "^r/[a-zA-Z0-9_]+$"
          },
          "author": {
            "type": "string"
          },
          "upvotes": {
            "type": "integer",
            "minimum": 0
          },
          "post_text": {
            "type": "string"
          },
          "post_date": {
            "type": "string",
            "format": "date-time"
          },
          "comments": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "author": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                },
                "upvotes": {
                  "type": "integer"
                },
                "comment_date": {
                  "type": "string",
                  "format": "date-time"
                },
                "sentiment": {
                  "type": "number",
                  "minimum": -1,
                  "maximum": 1
                }
              },
              "required": ["author", "text", "upvotes"]
            }
          }
        },
        "required": ["title", "url", "subreddit", "author", "upvotes", "comments"]
      }
    },
    "insights": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string"
          },
          "source": {
            "type": "object",
            "properties": {
              "post_url": {
                "type": "string",
                "format": "uri"
              },
              "comment_author": {
                "type": "string"
              },
              "upvotes": {
                "type": "integer"
              },
              "subreddit": {
                "type": "string",
                "pattern": "^r/[a-zA-Z0-9_]+$"
              }
            },
            "required": ["post_url", "comment_author", "upvotes", "subreddit"]
          },
          "insight_type": {
            "type": "string",
            "enum": ["advice", "experience", "opinion", "fact"]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          }
        },
        "required": ["text", "source", "insight_type", "confidence"]
      }
    },
    "query": {
      "type": "string"
    },
    "total_posts_found": {
      "type": "integer"
    },
    "total_comments_analyzed": {
      "type": "integer"
    }
  },
  "required": ["posts", "insights", "query", "total_posts_found", "total_comments_analyzed"]
}
""")

# Define the grammar for response formatting
reddit_response_grammar = Grammar("""
response ::= introduction insights conclusion
introduction ::= "# Reddit Insights: " query "\n\n" "Based on " post_count " relevant posts from Reddit, here are the key insights:\n\n"
query ::= /[^\\n]+/
post_count ::= /[0-9]+/
insights ::= insight+
insight ::= "## " insight_text "\n\n" citation "\n\n"
insight_text ::= /[^\\n]+/
citation ::= "> " quote "\n\n" "— " author " {" upvotes "↑} from " subreddit
quote ::= /"[^"]+"/
author ::= /u\/[a-zA-Z0-9_-]+/
upvotes ::= /[0-9]+/
subreddit ::= /r\/[a-zA-Z0-9_-]+/
conclusion ::= "## Summary\n\n" summary_text
summary_text ::= /[^\\n]+(\n[^\\n]+)*/
""")

# Apply the schemas to constrain the LLM output
def generate_reddit_response(query, search_results):
    # Format the search results according to the schema
    structured_results = llm.generate(
        f"Format these Reddit search results for the query '{query}':\n{search_results}",
        schema=reddit_result_schema
    )
    
    # Generate the final response with the appropriate grammar
    response = llm.generate(
        f"Generate a response for the query '{query}' based on these Reddit insights:\n{structured_results}",
        grammar=reddit_response_grammar
    )
    
    return response
```

### 3. aici Implementation

The Ask Reddit Agent needs fine-grained control over the generation of insights from Reddit content. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import json
import httpx
import re
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

async def ask_reddit_agent(query):
    # Begin the response generation
    await aici.FixedTokens(f"# Reddit Insights: {query}\n\n")
    
    # Search for relevant Reddit posts
    search_results = await search_reddit_posts(query)
    
    if not search_results["posts"]:
        await aici.FixedTokens("I couldn't find any relevant Reddit posts for this query. Please try a different search term or phrase your question differently.")
        return
    
    # Display the number of posts found
    post_count = len(search_results["posts"])
    await aici.FixedTokens(f"Based on {post_count} relevant posts from Reddit, here are the key insights:\n\n")
    
    # Process each post and extract insights
    all_insights = []
    for post in search_results["posts"]:
        post_insights = await extract_insights_from_post(post)
        all_insights.extend(post_insights)
    
    # Rank and filter insights
    ranked_insights = rank_insights(all_insights)
    
    # Generate insights with controlled token generation
    for i, insight in enumerate(ranked_insights[:5]):  # Limit to top 5 insights
        # Generate insight heading
        await aici.FixedTokens(f"## Insight {i+1}: ")
        
        # Allow the model to generate the insight title
        await aici.TokensWithLogprobs(
            max_tokens=20,
            temperature=0.3,
            stop_sequences=["\n"]
        )
        
        await aici.FixedTokens("\n\n")
        
        # Format the citation with exact quote, author, upvotes, and subreddit
        quote = insight["text"]
        author = insight["source"]["comment_author"]
        upvotes = insight["source"]["upvotes"]
        subreddit = insight["source"]["subreddit"]
        post_url = insight["source"]["post_url"]
        
        await aici.FixedTokens(f"> \"{quote}\"\n\n")
        await aici.FixedTokens(f"— [u/{author}]({post_url}) {{{upvotes}↑}} from {subreddit}\n\n")
    
    # Generate a summary conclusion
    await aici.FixedTokens("## Summary\n\n")
    
    # Allow the model to generate the summary
    await aici.TokensWithLogprobs(
        max_tokens=150,
        temperature=0.4,
        stop_sequences=["##", "#"]
    )
    
    return await aici.GetCurrentCompletion()

async def search_reddit_posts(query):
    """Search for Reddit posts using Brave Search API."""
    # Format the search query to focus on Reddit
    search_query = f"{query} site:reddit.com"
    
    # Call Brave Search API
    brave_api_key = await aici.GetEnvironmentVariable("BRAVE_API_KEY")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": search_query, "count": 10},
            headers={"Accept": "application/json", "X-Subscription-Token": brave_api_key}
        )
    
    search_data = response.json()
    
    # Filter results to only include Reddit posts
    reddit_posts = []
    for result in search_data.get("results", []):
        if "reddit.com/r/" in result["url"] and "/comments/" in result["url"]:
            # Extract post data
            post = {
                "title": result["title"],
                "url": result["url"],
                "subreddit": extract_subreddit(result["url"]),
                "comments": await fetch_comments(result["url"])
            }
            reddit_posts.append(post)
    
    return {"posts": reddit_posts}

async def fetch_comments(post_url):
    """Fetch comments from a Reddit post."""
    # Implementation details for fetching and parsing Reddit comments
    # This would use httpx to fetch the page and BeautifulSoup to parse it
    pass

async def extract_insights_from_post(post):
    """Extract insights from a post and its comments."""
    # Implementation details for insight extraction
    pass

def rank_insights(insights):
    """Rank insights based on relevance and upvotes."""
    # Implementation details for ranking
    pass

def extract_subreddit(url):
    """Extract subreddit name from URL."""
    match = re.search(r"reddit\.com/r/([^/]+)", url)
    if match:
        return f"r/{match.group(1)}"
    return "Unknown subreddit"
```

## Integration and Optimization

To integrate the Ask Reddit Agent with the SolnAI platform:

1. **API Integration**:
   ```python
   from fastapi import FastAPI, Body, HTTPException
   
   app = FastAPI(title="Ask Reddit API")
   
   @app.post("/search-reddit")
   async def search_reddit_endpoint(
       query: str = Body(...),
       max_posts: int = Body(5),
       max_comments_per_post: int = Body(10)
   ):
       # Validate inputs
       if not query:
           raise HTTPException(status_code=400, detail="Query cannot be empty")
       
       # Process the request using the Ask Reddit chain
       result = await ask_reddit_chain(
           query=query,
           max_posts=max_posts,
           max_comments_per_post=max_comments_per_post
       )
       
       return result
   ```

2. **UI Components**:
   ```javascript
   // React component for displaying Reddit insights
   import React from 'react';
   
   const RedditInsight = ({ insight }) => {
     const { text, source } = insight;
     const { comment_author, upvotes, subreddit, post_url } = source;
     
     return (
       <div className="reddit-insight">
         <blockquote>"{text}"</blockquote>
         <div className="citation">
           — <a href={post_url}>u/{comment_author}</a> {upvotes}↑ from {subreddit}
         </div>
       </div>
     );
   };
   
   const RedditResults = ({ results }) => {
     return (
       <div className="reddit-results">
         <h2>Reddit Insights</h2>
         {results.insights.map((insight, index) => (
           <RedditInsight key={index} insight={insight} />
         ))}
       </div>
     );
   };
   ```

3. **Performance Optimization**:
   - Implement caching for frequent queries
   - Use parallel processing for fetching multiple posts
   - Implement rate limiting to respect Reddit's API guidelines

4. **Security Considerations**:
   ```python
   # Sanitize user inputs
   def sanitize_query(query):
       # Remove potentially harmful characters
       sanitized = re.sub(r'[^\w\s]', '', query)
       # Limit query length
       return sanitized[:100]
   
   # Implement rate limiting
   from fastapi import Depends, HTTPException
   from fastapi.security import APIKeyHeader
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   
   @app.post("/search-reddit")
   @limiter.limit("5/minute")
   async def search_reddit_endpoint(
       query: str = Body(...),
       max_posts: int = Body(5),
       max_comments_per_post: int = Body(10)
   ):
       # Implementation
   ```

## Testing and Validation

To ensure the Ask Reddit Agent functions correctly:

1. **Unit Tests**:
   - Test query optimization
   - Test Reddit post filtering
   - Test insight extraction and ranking

2. **Integration Tests**:
   - Test the full search workflow
   - Verify API endpoints with various queries
   - Test UI components with mock data

3. **Validation Scenarios**:
   - Simple factual queries (e.g., "Best restaurants in Chicago")
   - Opinion-based queries (e.g., "Is MacBook Air worth it?")
   - Comparison queries (e.g., "NYC vs SF living")
   - Recommendation queries (e.g., "Good sci-fi books")

By following this implementation guide, you'll create a robust Ask Reddit Agent that effectively searches Reddit, extracts valuable insights, and presents them in a structured, user-friendly format.
