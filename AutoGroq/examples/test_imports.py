import os
import sys
import openai
import groq
import datetime

# Access API keys from environment
openai_api_key = os.environ.get("OPENAI_API_KEY")
groq_api_key = os.environ.get("GROQ_API_KEY")

# Initialize clients
openai_client = openai.OpenAI(api_key=openai_api_key or "mock-key")
groq_client = groq.Groq(api_key=groq_api_key or "mock-key")

print(f"Test run at: {datetime.datetime.now()}")
print(f"OpenAI client initialized: {openai_api_key is not None}")
print(f"Groq client initialized: {groq_api_key is not None}")
print("This is a mock test to verify imports are working correctly")

