import os
from dotenv import load_dotenv
import groq

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

groq_client = groq.Groq(api_key=API_KEY)

def groq_chat(prompt, system_prompt=None, max_tokens=512, temperature=0.7):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    response = groq_client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )
    content = response.choices[0].message.content
    return content if content is not None else ""

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
    text = groq_chat(prompt, system_prompt="You are a helpful AI career coach.")
    return {
        "response": text.strip() if text else "Sorry, I could not generate a response at this time."
    } 