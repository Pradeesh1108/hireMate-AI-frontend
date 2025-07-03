import os
from dotenv import load_dotenv
import groq

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

groq_client = groq.Groq(api_key=API_KEY)

response = groq_client.chat.completions.create(
    model=MODEL_NAME,
    messages=[{"role": "user", "content": "Tell me a joke about AI."}],
    max_tokens=128,
    temperature=0.7
)
print(response.choices[0].message.content)
