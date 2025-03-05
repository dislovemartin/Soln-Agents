# Bali Property Agent Implementation Guide

## Name
bali-property-agent

## Description
The Bali Property Agent is a conversational AI agent designed for a real estate agency called Propertia Bali. It serves as a lead qualification and property recommendation system, helping potential buyers explore properties, schedule visits, and get answers to common questions about real estate in Bali.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Bali Property Agent uses llm-chain to orchestrate the complex workflow of property recommendations and lead qualification:

```python
from llm_chain import Chain, Step

def property_recommendation_chain(user_preferences, available_properties):
    chain = Chain.new()
        .step(Step.new("validate_preferences", validate_user_preferences))
        .step(Step.new("match_properties", match_properties_to_preferences, 
              depends_on=["validate_preferences"]))
        .step(Step.new("rank_properties", rank_matched_properties, 
              depends_on=["match_properties"]))
        .step(Step.new("generate_descriptions", generate_property_descriptions, 
              depends_on=["rank_properties"]))
        .step(Step.new("prepare_response", format_property_recommendations, 
              depends_on=["generate_descriptions"]))
    
    return chain.execute({
        "user_preferences": user_preferences,
        "available_properties": available_properties
    })
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for property recommendations and booking confirmations:

```python
from llguidance import Guidance

property_schema = {
    "type": "object",
    "properties": {
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "property_id": {"type": "string"},
                    "title": {"type": "string"},
                    "price": {"type": "number"},
                    "bedrooms": {"type": "integer"},
                    "bathrooms": {"type": "integer"},
                    "area_sqm": {"type": "number"},
                    "location": {"type": "string"},
                    "match_score": {"type": "number"},
                    "highlights": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["property_id", "title", "price", "match_score"]
            }
        },
        "total_matches": {"type": "integer"}
    }
}

property_guidance = Guidance.new().with_json_schema(property_schema)
```

#### aici Integration
The agent uses aici for real-time control over the conversation flow, especially for handling complex property queries:

```python
import aici

async def property_inquiry_handler(user_query):
    # Detect if user is asking about property features
    if await aici.detect_property_feature_query(user_query):
        await aici.FixedTokens("Let me find properties with those features for you.\n")
        # Proceed with property search
    # Detect if user is asking about location
    elif await aici.detect_location_query(user_query):
        await aici.FixedTokens("I can help you explore that area. Here's what you need to know:\n")
        # Provide location information
    else:
        # Handle general inquiries
        await aici.FixedTokens("I'd be happy to help with your property search. Could you tell me more about what you're looking for?\n")
```

### Architecture
The Bali Property Agent uses a single-agent architecture with multiple specialized components:

1. **Query Analyzer**: Interprets user requests and extracts preferences
2. **Property Matcher**: Matches user preferences with available properties
3. **Booking Manager**: Handles scheduling and calendar integration
4. **FAQ Responder**: Answers common questions using the knowledge base

### Performance Optimization
- **Caching**: Property data is cached to reduce database queries
- **Batching**: Property recommendations are processed in batches
- **Pre-computation**: Common property features are pre-computed for faster matching

### Ethical Considerations
- **Transparency**: The agent clearly identifies itself as an AI assistant
- **Privacy**: User preferences are stored securely and only used for property recommendations
- **Consent**: Users are informed about data usage before proceeding with bookings

## Example Usage

### Property Recommendation Flow
```python
# Initialize the agent with property database
agent = BaliPropertyAgent(property_database, knowledge_base)

# Handle user query
response = agent.process_query("I'm looking for a 3-bedroom villa in Seminyak with a pool, budget around $500k")

# Output structured property recommendations
print(response.recommendations)
```

### Booking Management
```python
# Schedule a property viewing
booking = agent.schedule_viewing(
    property_id="PROP123",
    user_details={"name": "John Smith", "email": "john@example.com", "phone": "+1234567890"},
    preferred_dates=["2025-03-10", "2025-03-11"]
)

# Confirm booking details
print(f"Booking confirmed for {booking.confirmed_date} with {booking.agent_name}")
```

## Testing
The agent includes comprehensive testing for:
- Property matching accuracy
- Conversation flow handling
- Calendar integration
- Lead qualification logic
- Knowledge base retrieval

Tests are automated and run against a test property database to ensure consistent performance across different user scenarios.
