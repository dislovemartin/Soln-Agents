# Tweet Generator Agent Implementation Guide

## Overview

The Tweet Generator Agent is designed to create engaging, on-brand tweets based on user inputs, trending topics, and content guidelines. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The Tweet Generator Agent requires a streamlined workflow to generate relevant and engaging tweets. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def tweet_generator_chain(topic=None, brand_voice=None, trending_hashtags=None, character_limit=280):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("analyze_topic", analyze_topic_relevance, 
             config={"depth": "medium", "sentiment_analysis": True}),
        
        Step("research_trending", research_trending_content, 
             config={"platform": "twitter", "recency": "24h", "relevance_threshold": 0.7}),
        
        Step("identify_hashtags", identify_relevant_hashtags, 
             depends_on=["analyze_topic", "research_trending"],
             config={"max_hashtags": 3, "trending_boost": True}),
        
        Step("generate_hooks", generate_attention_hooks, 
             depends_on=["analyze_topic"],
             config={"hook_types": ["question", "statistic", "bold_statement"], "count": 3}),
        
        Step("craft_tweet_variants", craft_tweet_variants, 
             depends_on=["analyze_topic", "identify_hashtags", "generate_hooks"],
             config={"variants_count": 5, "character_limit": character_limit, 
                     "include_hashtags": True, "include_emoji": True}),
        
        Step("evaluate_engagement", predict_engagement_metrics, 
             depends_on=["craft_tweet_variants"],
             config={"metrics": ["likes", "retweets", "replies", "clicks"]}),
        
        Step("select_best_tweet", select_best_tweet, 
             depends_on=["craft_tweet_variants", "evaluate_engagement"],
             config={"prioritize": "engagement", "brand_alignment": True}),
        
        Step("finalize_tweet", finalize_tweet_content, 
             depends_on=["select_best_tweet"],
             config={"final_check": True, "character_limit": character_limit})
    ]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=3)
    
    # Prepare input data
    input_data = {
        "topic": topic,
        "brand_voice": brand_voice,
        "trending_hashtags": trending_hashtags,
        "character_limit": character_limit
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The Tweet Generator Agent needs to ensure tweets follow specific formats and constraints. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for tweet structure with optimal constraints
tweet_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "minLength": 10,
      "maxLength": 280
    },
    "hashtags": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^#[a-zA-Z0-9]+"
      },
      "maxItems": 3
    },
    "mentions": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^@[a-zA-Z0-9_]+"
      },
      "maxItems": 2
    },
    "media_suggestion": {
      "type": "string",
      "enum": ["image", "gif", "video", "none"]
    },
    "engagement_prediction": {
      "type": "object",
      "properties": {
        "likes": {
          "type": "integer",
          "minimum": 0
        },
        "retweets": {
          "type": "integer",
          "minimum": 0
        },
        "replies": {
          "type": "integer",
          "minimum": 0
        }
      },
      "required": ["likes", "retweets", "replies"]
    }
  },
  "required": ["content", "hashtags", "media_suggestion"]
}
""")

# Define the grammar for tweet content
tweet_grammar = Grammar("""
tweet ::= hook body hashtags
hook ::= question | statistic | bold_statement | emoji_start
question ::= /^[^.!?]+\?/
statistic ::= /^[0-9]+%/ /[^.!?]+[.!]/
bold_statement ::= /^[A-Z][^.!?]+[!]/
emoji_start ::= /^[\\p{Emoji}]/ /[^.!?]+[.!?]/
body ::= /[^#@]+/
hashtags ::= hashtag{0,3}
hashtag ::= /\s#[a-zA-Z0-9]+/
""")

# Define the grammar for brand voice styles
brand_voice_grammar = Grammar("""
brand_voice ::= professional | casual | humorous | informative
professional ::= /^[A-Z]/ /[^!?]+\./ hashtags
casual ::= /^[A-Za-z]/ /[^.]+[!?]/ hashtags
humorous ::= /^[A-Za-z]/ /[^.!?]+[!?]/ emoji hashtags
informative ::= /^[A-Z]/ /[^.!?]+[.]/ hashtags
emoji ::= /[\\p{Emoji}]/
hashtags ::= hashtag{0,3}
hashtag ::= /\s#[a-zA-Z0-9]+/
""")

# Apply the schemas to constrain the LLM output
def generate_tweet(topic, brand_voice, trending_hashtags=None):
    # Generate tweet with structured output
    tweet_prompt = f"Create an engaging tweet about {topic} with a {brand_voice} brand voice."
    if trending_hashtags:
        tweet_prompt += f" Consider using these trending hashtags: {', '.join(trending_hashtags)}."
    
    # Select the appropriate grammar based on brand voice
    if brand_voice == "professional":
        grammar = brand_voice_grammar.professional
    elif brand_voice == "casual":
        grammar = brand_voice_grammar.casual
    elif brand_voice == "humorous":
        grammar = brand_voice_grammar.humorous
    elif brand_voice == "informative":
        grammar = brand_voice_grammar.informative
    else:
        grammar = tweet_grammar
    
    # Generate tweet with appropriate constraints
    tweet = llm.generate(tweet_prompt, grammar=grammar)
    
    # Validate against the schema
    tweet_object = llm.generate(
        f"Create a structured tweet object for: {tweet}",
        grammar=tweet_schema
    )
    
    return tweet_object
```

### 3. aici Implementation

The Tweet Generator Agent needs fine-grained control over token generation for creating engaging tweets. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import random
import json

async def generate_tweet(topic, brand_voice, trending_hashtags=None, character_limit=280):
    # Initialize context with topic and brand voice
    context = {
        "topic": topic,
        "brand_voice": brand_voice,
        "trending_hashtags": trending_hashtags or [],
        "character_limit": character_limit
    }
    
    # Get trending information from external API
    if not trending_hashtags:
        trending_data = await aici.call_external_api(
            "trending_api",
            {"related_to": topic, "count": 5},
            timeout=5000
        )
        context["trending_hashtags"] = trending_data.get("hashtags", [])
    
    # Start generating the tweet with controlled structure
    tweet_variants = []
    
    # Generate multiple variants with different hooks
    hook_types = ["question", "statistic", "bold_statement", "emoji"]
    
    for i in range(min(4, len(hook_types))):
        hook_type = hook_types[i]
        
        # Set up the generation context
        await aici.FixedTokens(f"Generating tweet variant {i+1} with {hook_type} hook about {topic}:\n\n")
        
        # Generate the hook based on type
        if hook_type == "question":
            await aici.FixedTokens("Tweet: ")
            question_marker = aici.Label()
            await aici.gen_text(stop_at="?", max_tokens=100)
            await aici.FixedTokens("? ")
        elif hook_type == "statistic":
            await aici.FixedTokens("Tweet: ")
            await aici.gen_text(stop_at="%", prefix_tokens=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], max_tokens=3)
            await aici.FixedTokens("% ")
            statistic_marker = aici.Label()
            await aici.gen_text(stop_at=".", max_tokens=100)
            await aici.FixedTokens(". ")
        elif hook_type == "bold_statement":
            await aici.FixedTokens("Tweet: ")
            bold_marker = aici.Label()
            await aici.gen_text(stop_at="!", max_tokens=100)
            await aici.FixedTokens("! ")
        elif hook_type == "emoji":
            await aici.FixedTokens("Tweet: ")
            # Generate an emoji from a curated list
            emoji_list = ["😮", "🔥", "✨", "📊", "🚀", "💡", "📈", "🎯", "👀", "🙌"]
            selected_emoji = random.choice(emoji_list)
            await aici.FixedTokens(f"{selected_emoji} ")
            emoji_marker = aici.Label()
            await aici.gen_text(stop_at=".", max_tokens=100)
            await aici.FixedTokens(". ")
        
        # Generate the body of the tweet
        body_marker = aici.Label()
        await aici.gen_text(stop_at=" #", max_tokens=200)
        
        # Add hashtags
        hashtag_marker = aici.Label()
        if context["trending_hashtags"]:
            # Use 1-3 trending hashtags
            num_hashtags = min(3, len(context["trending_hashtags"]))
            selected_hashtags = random.sample(context["trending_hashtags"], num_hashtags)
            
            for hashtag in selected_hashtags:
                if not hashtag.startswith("#"):
                    hashtag = f"#{hashtag}"
                await aici.FixedTokens(f" {hashtag}")
        else:
            # Generate 1-2 relevant hashtags
            await aici.FixedTokens(" #")
            await aici.gen_text(stop_at=" ", max_tokens=20)
            
            # 50% chance of adding a second hashtag
            if random.random() > 0.5:
                await aici.FixedTokens(" #")
                await aici.gen_text(stop_at="\n", max_tokens=20)
        
        # Store the generated tweet
        tweet_text = aici.get_generated_text()
        
        # Check character limit
        if len(tweet_text) <= character_limit:
            tweet_variants.append(tweet_text)
        else:
            # Truncate and add hashtags if too long
            truncated_body = body_marker.text_since()[:character_limit - 30]  # Leave room for hashtags
            hashtags = hashtag_marker.text_since()
            
            # Limit to 2 hashtags if needed
            hashtag_parts = hashtags.strip().split(" ")
            if len(hashtag_parts) > 2:
                hashtags = " ".join(hashtag_parts[:2])
                
            tweet_variants.append(truncated_body + hashtags)
    
    # Select the best variant based on engagement prediction
    engagement_scores = []
    for variant in tweet_variants:
        # Predict engagement using an external API or model
        engagement = await aici.call_external_api(
            "engagement_predictor",
            {"tweet_text": variant, "topic": topic},
            timeout=3000
        )
        engagement_scores.append(engagement["score"])
    
    # Return the variant with the highest predicted engagement
    best_variant_index = engagement_scores.index(max(engagement_scores))
    best_tweet = tweet_variants[best_variant_index]
    
    return {
        "tweet": best_tweet,
        "predicted_engagement": engagement_scores[best_variant_index],
        "character_count": len(best_tweet)
    }

# Start the aici controller with optimal timeout
aici.start(generate_tweet(topic, brand_voice, trending_hashtags, character_limit), timeout=30000)
```

## Integration and Optimization

To integrate all three modules for the Tweet Generator Agent:

```python
def tweet_generator_agent(topic, brand_voice="casual", trending_hashtags=None, character_limit=280):
    # 1. Use llm-chain for the overall workflow
    chain_results = tweet_generator_chain(
        topic=topic,
        brand_voice=brand_voice,
        trending_hashtags=trending_hashtags,
        character_limit=character_limit
    )
    
    # Extract the best tweet candidates and context
    best_candidates = chain_results["craft_tweet_variants"]["variants"]
    hashtags = chain_results["identify_hashtags"]["hashtags"]
    engagement_predictions = chain_results["evaluate_engagement"]["predictions"]
    
    # 2. Apply llguidance constraints to ensure proper formatting
    formatted_tweet = generate_tweet(
        topic=topic,
        brand_voice=brand_voice,
        trending_hashtags=hashtags
    )
    
    # 3. Use aici for final output generation with precise control
    final_tweet = aici.run(
        generate_tweet,
        topic=topic,
        brand_voice=brand_voice,
        trending_hashtags=hashtags,
        character_limit=character_limit,
        context={
            "best_candidates": best_candidates,
            "engagement_predictions": engagement_predictions,
            "formatted_tweet": formatted_tweet
        },
        max_tokens=300,
        temperature=0.7
    )
    
    return final_tweet
```

## Optimal Configuration Values

For the Tweet Generator Agent, the following configuration values are optimal:

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `batch_size` | 2 | Efficient for tweet generation without excessive memory usage |
| `max_concurrency` | 3 | Balances parallel processing for tweet variants |
| `max_hashtags` | 3 | Optimal number for engagement without cluttering |
| `variants_count` | 5 | Provides sufficient options for selection |
| `character_limit` | 280 | Standard Twitter character limit |
| `recency` | "24h" | Ensures trending topics are current |
| `relevance_threshold` | 0.7 | Balances relevance with diversity |
| `temperature` | 0.7 | Provides creativity while maintaining coherence |
| `max_tokens` | 300 | Sufficient for tweet generation with buffer |
| `timeout` | 30000 | Allows for API calls and processing (30 seconds) |

## Conclusion

This implementation guide provides a comprehensive approach to implementing the SolnAI core modules for the Tweet Generator Agent. By following these guidelines and using the optimal configuration values, you can create a powerful tweet generation tool that produces engaging, on-brand content optimized for social media engagement. 