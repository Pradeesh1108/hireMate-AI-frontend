import os
from dotenv import load_dotenv
import google.generativeai as genai  # Make sure you have version >=1.0.0

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
MODEL_NAME = "gemini-1.5-flash"
# Configure Gemini
genai.configure(api_key=API_KEY)  # pyright: ignore

model = genai.GenerativeModel("gemini-1.5-flash")  # pyright: ignore
response = model.generate_content("Tell me a joke about AI.")
print(response.text)
