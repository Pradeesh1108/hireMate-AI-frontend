import google.generativeai as genai  # pyright: ignore
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
MODEL_NAME = "gemini-1.5-flash"
genai.configure(api_key=API_KEY)  # pyright: ignore

def career_assistant(payload):
    resume_text = payload.get("resumeText", "")
    job_description = payload.get("jobDescription", "")
    user_message = payload.get("message", "")
    prompt = (
        "You are an expert AI career coach. "
        "Given the following resume and job description, provide a detailed, helpful, and personalized response to the user's message. "
        "Be specific, actionable, and encouraging.\n"
        f"Resume: {resume_text}\n"
        f"Job Description: {job_description}\n"
        f"User Message: {user_message}"
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    return {
        "response": response.text.strip() if response and response.text else "Sorry, I could not generate a response at this time."
    } 