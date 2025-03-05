# Lead Generator Agent Implementation Guide

## Name
lead-generator-agent

## Description
The Lead Generator Agent is an intelligent assistant for business lead generation. It uses the Hunter.io API to find business email addresses, verify emails, and generate leads. Built with Pydantic AI, the agent provides domain email searches, email verification, and detailed statistics about email distribution within organizations. It's designed to help sales teams, marketers, and business developers efficiently identify and validate potential business contacts.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Lead Generator Agent uses llm-chain concepts through Pydantic AI's workflow orchestration:

```python
from llm_chain import Chain, Step

def lead_generation_chain(domain_or_email):
    """
    Create a chain for lead generation processes.
    
    Args:
        domain_or_email: Domain name or email address to process
        
    Returns:
        A configured Chain object
    """
    chain = Chain.new()
    
    # Step 1: Determine if input is domain or email
    chain.step(Step.new("determine_input_type", determine_input_type))
    
    # Step 2a: If domain, process domain search
    chain.step(Step.new("process_domain", process_domain_search, 
                       depends_on=["determine_input_type"],
                       condition=lambda result: result["input_type"] == "domain"))
    
    # Step 2b: If email, process email verification
    chain.step(Step.new("verify_email", verify_email_address, 
                       depends_on=["determine_input_type"],
                       condition=lambda result: result["input_type"] == "email"))
    
    # Step 3: Get statistics (for domains)
    chain.step(Step.new("get_statistics", get_email_statistics, 
                       depends_on=["process_domain"],
                       condition=lambda result: "domain_results" in result))
    
    # Step 4: Format response
    chain.step(Step.new("format_response", format_lead_response, 
                       depends_on=["process_domain", "verify_email", "get_statistics"]))
    
    return chain

# Implementation in Pydantic AI agent
from pydantic_ai import Agent, RunContext

hunter_agent = Agent(
    model=model,
    system_prompt=system_prompt,
    functions=[
        domain_search,
        get_email_count,
        verify_email
    ]
)

async def process_lead_request(query, ctx):
    """Process a lead generation request."""
    # Determine if query is domain or email
    if "@" in query:
        result = await hunter_agent.acall(
            [{"role": "user", "content": f"Verify this email address: {query}"}],
            ctx
        )
    else:
        domain = query.strip()
        domain_info = await hunter_agent.acall(
            [{"role": "user", "content": f"Find email addresses for the domain: {domain}"}],
            ctx
        )
        
        # Get statistics for domain
        statistics = await hunter_agent.acall(
            [{"role": "user", "content": f"Get email statistics for the domain: {domain}"}],
            ctx
        )
        
        result = f"{domain_info}\n\n{statistics}"
    
    return result
```

#### llguidance Integration
The agent uses llguidance concepts through Pydantic's structured data models:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Define structured schema for domain search results
class EmailResult(BaseModel):
    """Structured representation of an email search result."""
    email: str = Field(..., description="The email address")
    first_name: Optional[str] = Field(None, description="First name if available")
    last_name: Optional[str] = Field(None, description="Last name if available")
    position: Optional[str] = Field(None, description="Job position if available")
    department: Optional[str] = Field(None, description="Department if available")
    confidence: float = Field(..., description="Confidence score of email validity (0-100)")

class DomainSearchResult(BaseModel):
    """Structured representation of a domain search result."""
    domain: str = Field(..., description="The domain that was searched")
    organization: Optional[str] = Field(None, description="Organization name if available")
    emails: List[EmailResult] = Field(default_factory=list, description="List of found emails")
    total_results: int = Field(..., description="Total number of emails found")

# Define structured schema for email verification
class EmailVerification(BaseModel):
    """Structured representation of an email verification result."""
    email: str = Field(..., description="The email that was verified")
    status: str = Field(..., description="Verification status (valid, invalid, etc.)")
    score: float = Field(..., description="Deliverability score (0-100)")
    mx_records: bool = Field(..., description="Whether the domain has MX records")
    smtp_server: bool = Field(..., description="Whether SMTP server responded")
    smtp_check: bool = Field(..., description="Whether SMTP check passed")
    disposable: bool = Field(..., description="Whether it's a disposable email")
    webmail: bool = Field(..., description="Whether it's a webmail email")

# Define structured schema for email count statistics
class DepartmentStat(BaseModel):
    """Statistics for emails by department."""
    department: str = Field(..., description="Department name")
    count: int = Field(..., description="Number of emails in this department")
    percentage: float = Field(..., description="Percentage of total emails")

class EmailStatistics(BaseModel):
    """Structured representation of email statistics for a domain."""
    domain: str = Field(..., description="The domain analyzed")
    total_emails: int = Field(..., description="Total number of emails found")
    pattern_types: Dict[str, int] = Field(..., description="Email pattern distribution")
    departments: List[DepartmentStat] = Field(default_factory=list, description="Department statistics")
```

#### aici Integration
The agent implements aici concepts through its dynamic response handling:

```python
# Conceptual implementation of aici in lead generation context
async def process_domain_search(domain: str):
    """
    Process a domain search request with dynamic response handling.
    """
    # Detect domain pattern
    if domain.startswith("www."):
        await aici.FixedTokens("Processing with www prefix...\n")
        domain = domain  # Keep as is
    else:
        await aici.FixedTokens("Adding www prefix for better results...\n")
        domain = f"www.{domain}"
    
    # Check domain validity
    if "." not in domain:
        await aici.FixedTokens("Invalid domain format detected. Domain must contain at least one period.\n")
        return {"error": "Invalid domain format"}
    
    # Determine search depth based on domain characteristics
    if is_large_company(domain):
        await aici.FixedTokens("Detected large company domain. Limiting search to key departments...\n")
        departments = ["marketing", "sales", "executive"]
    else:
        await aici.FixedTokens("Performing comprehensive search across all departments...\n")
        departments = None
    
    # Execute search with appropriate parameters
    results = perform_domain_search(domain, departments=departments)
    
    # Format response based on result size
    if len(results) > 10:
        await aici.FixedTokens("Found numerous results. Displaying summary and top 10 contacts...\n")
    else:
        await aici.FixedTokens("Displaying all found contacts...\n")
    
    return results
```

### Architecture
The Lead Generator Agent uses a single-agent architecture with the following components:

1. **Input Analyzer**: Determines if the input is a domain or email address
2. **Domain Searcher**: Searches for email addresses from a specific domain
3. **Email Verifier**: Verifies if an email address is valid
4. **Statistics Generator**: Gets the count and statistics of email addresses for a domain
5. **Response Formatter**: Formats the results into a structured, readable response

### Code Structure
```python
# Dependencies class for Hunter.io API
@dataclass
class HunterDeps:
    """Dependencies for the Hunter.io API agent."""
    client: httpx.AsyncClient
    hunter_api_key: str | None = None

# System prompt defining agent capabilities
system_prompt = """
You are a lead generation expert with access to Hunter.io API to help users find business email addresses and generate leads.
...
"""

# Domain search function
def domain_search(
    ctx: RunContext[HunterDeps], 
    domain: str,
    limit: Optional[int] = 10
):
    """Search for email addresses from a specific domain."""
    # Implementation details...

# Email count function
def get_email_count(ctx: RunContext[HunterDeps], domain: str):
    """Get the count and statistics of email addresses for a domain."""
    # Implementation details...

# Email verification function
def verify_email(ctx: RunContext[HunterDeps], email: str):
    """Verify if an email address is valid and get detailed information."""
    # Implementation details...

# Initialize the agent with model and functions
hunter_agent = Agent(
    model=model,
    system_prompt=system_prompt,
    functions=[
        domain_search,
        get_email_count,
        verify_email
    ]
)
```

### Performance Optimization
- **Caching**: Results from Hunter.io API are cached to reduce API calls
- **Rate Limiting**: Implements intelligent rate limiting to stay within API quotas
- **Batch Processing**: Groups related requests for more efficient processing
- **Asynchronous Operations**: Uses async/await for concurrent API calls

### Ethical Considerations
- **Data Privacy**: Only processes publicly available business email information
- **API Usage**: Adheres to Hunter.io's terms of service for API usage
- **Transparency**: Clearly communicates confidence scores for email validity
- **Rate Limiting**: Respects API rate limits to avoid service disruption

## Example Usage

### Domain Search
```python
from pydantic_ai import RunContext
import httpx
from leadgen_agent import hunter_agent, HunterDeps

async def search_domain(domain, api_key):
    """
    Search for email addresses from a domain.
    
    Args:
        domain: Domain to search (e.g., 'acme.com')
        api_key: Hunter.io API key
        
    Returns:
        Formatted string with search results
    """
    async with httpx.AsyncClient() as client:
        ctx = RunContext(HunterDeps(client=client, hunter_api_key=api_key))
        result = await hunter_agent.acall(
            [{"role": "user", "content": f"Find email addresses for {domain}"}],
            ctx
        )
        return result

# Example usage
import asyncio
result = asyncio.run(search_domain("example.com", "your_hunter_api_key"))
print(result)
```

### Email Verification
```python
from pydantic_ai import RunContext
import httpx
from leadgen_agent import hunter_agent, HunterDeps

async def verify_email_address(email, api_key):
    """
    Verify if an email address is valid.
    
    Args:
        email: Email address to verify
        api_key: Hunter.io API key
        
    Returns:
        Formatted string with verification results
    """
    async with httpx.AsyncClient() as client:
        ctx = RunContext(HunterDeps(client=client, hunter_api_key=api_key))
        result = await hunter_agent.acall(
            [{"role": "user", "content": f"Verify this email: {email}"}],
            ctx
        )
        return result

# Example usage
import asyncio
result = asyncio.run(verify_email_address("john.doe@example.com", "your_hunter_api_key"))
print(result)
```

### FastAPI Integration
```python
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from pydantic_ai import RunContext
from leadgen_agent import hunter_agent, HunterDeps

app = FastAPI()
security = HTTPBearer()

class LeadRequest(BaseModel):
    """Request model for lead generation."""
    query: str  # Domain or email
    user_id: str
    request_id: str
    session_id: str

class LeadResponse(BaseModel):
    """Response model for lead generation."""
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None

@app.post("/generate-leads", response_model=LeadResponse)
async def generate_leads(
    request: LeadRequest,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Generate leads from a domain or verify an email."""
    if credentials.credentials != os.getenv("API_BEARER_TOKEN"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        async with httpx.AsyncClient() as client:
            ctx = RunContext(HunterDeps(
                client=client,
                hunter_api_key=os.getenv("HUNTER_API_KEY")
            ))
            
            result = await hunter_agent.acall(
                [{"role": "user", "content": request.query}],
                ctx
            )
            
            return LeadResponse(success=True, result=result)
    except Exception as e:
        return LeadResponse(success=False, error=str(e))
```

## Testing
The agent includes comprehensive testing for:
- Hunter.io API integration
- Email validation logic
- Domain search functionality
- Error handling for API limits
- Response formatting

Tests are automated and cover both successful and error scenarios to ensure robust performance in various conditions.
