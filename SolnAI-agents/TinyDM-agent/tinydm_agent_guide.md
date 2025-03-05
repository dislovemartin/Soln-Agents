# TinyDM Agent Implementation Guide

## Overview

The TinyDM Agent is a lightweight, chat-based Dungeon Master assistant that helps DMs create and manage D&D 5E sessions through natural conversation. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The TinyDM Agent requires a conversational workflow to assist Dungeon Masters with D&D session management. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def tinydm_chain(user_message, session_id, session_context=None):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("retrieve_context", retrieve_session_history, 
             config={"session_id": session_id, "max_messages": 20, "include_metadata": True}),
        
        Step("analyze_intent", analyze_user_intent, 
             depends_on=["retrieve_context"],
             config={"intent_categories": ["rules_question", "encounter_generation", 
                                          "npc_creation", "location_description", 
                                          "plot_development", "combat_assistance"]}),
        
        Step("retrieve_knowledge", retrieve_dnd_knowledge, 
             depends_on=["analyze_intent"],
             config={"source_books": ["PHB", "DMG", "MM"], "max_chunks": 5}),
        
        Step("generate_encounter", generate_dnd_encounter, 
             depends_on=["analyze_intent", "retrieve_context"],
             config={"challenge_rating_adjustment": True, "balance_check": True}),
        
        Step("create_npc", create_dnd_npc, 
             depends_on=["analyze_intent", "retrieve_context"],
             config={"personality_traits": True, "stat_block": True, "background": True}),
        
        Step("describe_location", generate_location_description, 
             depends_on=["analyze_intent", "retrieve_context"],
             config={"detail_level": "high", "sensory_elements": True, "interactive_elements": True}),
        
        Step("provide_rules", provide_dnd_rules_assistance, 
             depends_on=["analyze_intent", "retrieve_knowledge"],
             config={"simplify_complex_rules": True, "include_page_references": True}),
        
        Step("assist_combat", provide_combat_assistance, 
             depends_on=["analyze_intent", "retrieve_context", "retrieve_knowledge"],
             config={"tactical_suggestions": True, "monster_abilities": True}),
        
        Step("develop_plot", generate_plot_elements, 
             depends_on=["analyze_intent", "retrieve_context"],
             config={"hook_types": ["mystery", "conflict", "discovery"], "tie_to_character_backgrounds": True}),
        
        Step("generate_response", generate_dm_response, 
             depends_on=["analyze_intent", "retrieve_knowledge", "generate_encounter", 
                         "create_npc", "describe_location", "provide_rules", 
                         "assist_combat", "develop_plot"],
             config={"tone": "helpful", "format": "conversational", "include_suggestions": True})
    ]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=3)
    
    # Prepare input data
    input_data = {
        "user_message": user_message,
        "session_id": session_id,
        "session_context": session_context
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The TinyDM Agent needs to ensure responses follow D&D conventions and provide useful DM assistance. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for DM assistant responses
dm_response_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "response_type": {
      "type": "string",
      "enum": ["rules_clarification", "encounter_suggestion", "npc_details", 
               "location_description", "plot_hook", "combat_advice", "general_assistance"]
    },
    "content": {
      "type": "string",
      "minLength": 50,
      "maxLength": 1000
    },
    "references": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "book": {
            "type": "string",
            "enum": ["PHB", "DMG", "MM", "XGE", "TCE", "VGM", "MTF", "Other"]
          },
          "page": {
            "type": "integer",
            "minimum": 1
          },
          "description": {
            "type": "string"
          }
        },
        "required": ["book", "description"]
      }
    },
    "suggestions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "maxItems": 3
    }
  },
  "required": ["response_type", "content"]
}
""")

# Define the grammar for encounter generation
encounter_grammar = Grammar("""
encounter ::= environment difficulty monsters treasure hooks
environment ::= location atmosphere obstacles
location ::= /[A-Z][^.!?]+[.]/
atmosphere ::= /The air feels [^.!?]+[.]/
obstacles ::= /[A-Z][^.!?]+ (provides|create|forms) [^.!?]+[.]/
difficulty ::= /This encounter is (easy|medium|hard|deadly) for a level [1-9][0-9]* party[.]/
monsters ::= monster+
monster ::= /- [1-9][0-9]* [^:]+: (AC|Armor Class) [0-9]+, HP [0-9]+, [^.!?]+[.]/
treasure ::= /Treasure: [^.!?]+[.]/
hooks ::= /Possible developments: [^.!?]+[.]/
""")

# Define the grammar for NPC creation
npc_grammar = Grammar("""
npc ::= description personality stats motivations
description ::= /[A-Z][^.!?]+ is a [^.!?]+[.]/
personality ::= trait+ 
trait ::= /- [A-Z][^.!?]+[.]/
stats ::= /Quick stats: (STR|DEX|CON|INT|WIS|CHA) [0-9]+, [^.!?]+[.]/
motivations ::= /Motivations: [^.!?]+[.]/
""")

# Apply the schemas to constrain the LLM output
def generate_dm_assistance(user_query, session_context):
    # Determine the type of assistance needed
    assistance_type = determine_assistance_type(user_query)
    
    # Generate response with appropriate grammar
    if assistance_type == "encounter_generation":
        response = llm.generate(
            f"Create a D&D encounter based on: {user_query}",
            grammar=encounter_grammar
        )
    elif assistance_type == "npc_creation":
        response = llm.generate(
            f"Create a D&D NPC based on: {user_query}",
            grammar=npc_grammar
        )
    else:
        # For other types, use the general response schema
        response = llm.generate(
            f"Provide D&D DM assistance for: {user_query}",
            schema=dm_response_schema
        )
    
    return response
```

### 3. aici Implementation

The TinyDM Agent needs interactive, context-aware responses for dynamic D&D session assistance. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import json

async def dm_assistant(user_message, session_id):
    # Retrieve session history from database
    session_history = await retrieve_session_history(session_id)
    
    # Initialize context with session information
    context = {
        "session_id": session_id,
        "history": session_history,
        "current_query": user_message
    }
    
    # Begin the response generation
    await aici.FixedTokens("# D&D Assistant Response\n\n")
    
    # Analyze the user's intent
    intent_analysis = await analyze_intent(user_message, session_history)
    intent_type = intent_analysis["primary_intent"]
    
    # Generate appropriate response based on intent
    if intent_type == "rules_question":
        await generate_rules_response(user_message, context)
    elif intent_type == "encounter_generation":
        await generate_encounter_response(user_message, context)
    elif intent_type == "npc_creation":
        await generate_npc_response(user_message, context)
    elif intent_type == "location_description":
        await generate_location_response(user_message, context)
    elif intent_type == "plot_development":
        await generate_plot_response(user_message, context)
    elif intent_type == "combat_assistance":
        await generate_combat_response(user_message, context)
    else:
        await generate_general_response(user_message, context)
    
    # Add suggestions for follow-up queries
    await aici.FixedTokens("\n\n## Suggested Follow-ups\n\n")
    suggestions = await generate_followup_suggestions(intent_type, user_message, context)
    
    for i, suggestion in enumerate(suggestions[:3]):
        await aici.FixedTokens(f"{i+1}. {suggestion}\n")
    
    # Store the interaction in the database
    response_content = await aici.GetCurrentCompletion()
    await store_message(session_id, {
        "role": "assistant",
        "content": response_content,
        "metadata": {
            "intent_type": intent_type,
            "timestamp": aici.current_timestamp()
        }
    })
    
    return {
        "response": response_content,
        "intent_type": intent_type,
        "session_id": session_id
    }

async def generate_rules_response(query, context):
    await aici.FixedTokens("## Rules Clarification\n\n")
    
    # Search for relevant rules
    rules_info = await search_dnd_rules(query)
    
    if rules_info["found"]:
        await aici.FixedTokens(f"According to the {rules_info['source']} (p. {rules_info['page']}), ")
        
        # Generate the rule explanation with controlled tokens
        await aici.TokensWithLogprobs(
            max_tokens=200,
            temperature=0.3,
            stop_sequences=["\n\n"]
        )
        
        # Add any exceptions or common misinterpretations
        await aici.FixedTokens("\n\n**Common Misinterpretations:**\n\n")
        await aici.TokensWithLogprobs(
            max_tokens=100,
            temperature=0.4,
            stop_sequences=["\n\n"]
        )
    else:
        await aici.FixedTokens("I couldn't find a specific rule for this question, but here's my best guidance:\n\n")
        await aici.TokensWithLogprobs(
            max_tokens=250,
            temperature=0.5,
            stop_sequences=["\n\n"]
        )

# Additional helper functions for other response types would be implemented similarly
```

## Integration and Optimization

To integrate the TinyDM Agent with the SolnAI platform:

1. **Database Integration**:
   ```python
   # Connect to Supabase for session persistence
   from supabase import create_client
   
   supabase = create_client(
       os.getenv("SUPABASE_URL"),
       os.getenv("SUPABASE_KEY")
   )
   
   async def store_message(session_id, message):
       return supabase.table("messages").insert({
           "session_id": session_id,
           "message": message
       }).execute()
   
   async def retrieve_session_history(session_id):
       response = supabase.table("messages")\
           .select("*")\
           .eq("session_id", session_id)\
           .order("created_at")\
           .execute()
       return response.data
   ```

2. **API Integration**:
   ```python
   from fastapi import FastAPI, Header, HTTPException
   
   app = FastAPI(title="TinyDM")
   
   @app.post("/dm-assistant")
   async def dm_assistant(request: dict, authorization: str = Header(None)):
       # Validate authorization
       if authorization != f"Bearer {os.getenv('BEARER_TOKEN')}":
           raise HTTPException(status_code=401, detail="Unauthorized")
       
       # Process the request using the TinyDM chain
       response = await tinydm_chain(
           user_message=request.get("message", ""),
           session_id=request.get("session_id", "default"),
           session_context=request.get("context", {})
       )
       
       return response
   ```

3. **Performance Optimization**:
   - Implement caching for frequently accessed D&D rules
   - Use vector embeddings for faster knowledge retrieval
   - Batch process multiple intents when detected in a single query

4. **Monitoring and Logging**:
   ```python
   import logging
   
   # Configure logging
   logging.basicConfig(level=logging.INFO)
   logger = logging.getLogger(__name__)
   
   # Add structured logging
   def log_interaction(session_id, user_message, response, processing_time):
       logger.info(
           f"Session: {session_id} | "
           f"Processing Time: {processing_time:.2f}s | "
           f"Intent: {response.get('intent_type', 'unknown')}"
       )
   ```

## Testing and Validation

To ensure the TinyDM Agent functions correctly:

1. **Unit Tests**:
   - Test each intent processing function independently
   - Validate rule lookups against known D&D rules
   - Ensure proper session history management

2. **Integration Tests**:
   - Test the full conversation flow with multiple turns
   - Verify database persistence and retrieval
   - Test API endpoints with various request formats

3. **Validation Scenarios**:
   - Rules clarification requests (e.g., "How does flanking work?")
   - Encounter generation (e.g., "Create a forest encounter for level 5 players")
   - NPC creation (e.g., "I need a mysterious elven shopkeeper")
   - Location descriptions (e.g., "Describe an ancient dwarven forge")

By following this implementation guide, you'll create a robust TinyDM Agent that provides valuable assistance to Dungeon Masters running D&D 5E sessions.
