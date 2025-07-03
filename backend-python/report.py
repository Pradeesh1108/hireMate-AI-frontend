from reportlab.pdfgen import canvas
import io
import os
import google.generativeai as genai  # pyright: ignore
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
MODEL_NAME = "gemini-1.5-flash"

# Configure Gemini
genai.configure(api_key=API_KEY)  # pyright: ignore

def generate_report(payload):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    y = 800

    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, y, "CareerMate AI - Professional Report")
    y -= 30

    user_name = payload.get('userName', 'N/A')
    ats_score = payload.get('atsScore', 'N/A')
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Candidate: {user_name}")
    y -= 20
    p.drawString(100, y, f"ATS Score: {ats_score}")
    y -= 20

    interview_data = payload.get('interviewData', [])
    p.drawString(100, y, "Interview Summary:")
    y -= 20

    for i, qa in enumerate(interview_data):
        p.drawString(110, y, f"Q{i+1}: {qa.get('question', '')}")
        y -= 15
        p.drawString(120, y, f"A: {qa.get('answer', '')}")
        y -= 15
        feedback = qa.get('feedback', '')
        if feedback:
            p.drawString(120, y, f"Feedback: {feedback}")
            y -= 15
        y -= 5
        if y < 100:
            p.showPage()
            y = 800

    p.save()
    buffer.seek(0)
    return buffer.read()

def generate_evaluation_report(client=None, model=MODEL_NAME, interview_data=None):
    if not interview_data:
        return "No interview data provided."

    prompt = """You are an expert AI interviewer tasked with evaluating a candidate's technical interview performance.
    Based on the interview questions, expected answers, and the candidate's actual responses, provide a comprehensive evaluation report.

    Your report should include:
    1. An overall assessment of the candidate's technical knowledge
    2. Specific strengths identified during the interview
    3. Areas for improvement
    4. Detailed feedback on each question, comparing the expected answer with what the candidate provided
    5. Concrete recommendations for the candidate to improve their knowledge and interview performance
    6. Be a little bit harsh and in the same time encouraging
    7. Talk directly to the candidate
    8. Use "you" and "your" to address the candidate
    9. Be professional and respectful
    10. Provide constructive and realistic feedback

    Interview Data:
    """
    for i, item in enumerate(interview_data):
        prompt += f"\n\nQuestion {i + 1}: {item['question_data']['question']}\n"
        prompt += f"Expected Answer: {item['question_data']['answer']}\n"
        prompt += f"Candidate's Response: {item['candidate_answer']}\n"
        prompt += f"Difficulty: {item['question_data'].get('difficulty', 'N/A')}\n"
        prompt += f"Topic: {item['question_data'].get('main_subject', 'N/A')}"

    model_instance = genai.GenerativeModel(model)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    return response.text
