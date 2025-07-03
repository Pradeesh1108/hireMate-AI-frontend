from reportlab.pdfgen import canvas
import io
import os
from dotenv import load_dotenv
import groq

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

groq_client = groq.Groq(api_key=API_KEY)

def groq_chat(prompt, system_prompt=None, max_tokens=1024, temperature=0.7):
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

def generate_report(payload):
    # If the frontend sent { reportData: {...} }, extract it
    if 'reportData' in payload:
        payload = payload['reportData']
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    y = 800

    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, y, "CareerMate AI - Professional Report")
    y -= 30

    ats_score = payload.get('atsScore', 'N/A')
    interview_score = payload.get('interviewScore', 'N/A')
    overall_grade = payload.get('overallGrade', 'N/A')
    total_questions = payload.get('totalQuestions', 'N/A')
    completed_at = payload.get('completedAt', 'N/A')
    strengths = payload.get('strengths', [])
    improvements = payload.get('improvements', [])

    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"ATS Score: {ats_score}")
    y -= 20
    p.drawString(100, y, f"Interview Score: {interview_score}")
    y -= 20
    p.drawString(100, y, f"Overall Grade: {overall_grade}")
    y -= 20
    p.drawString(100, y, f"Questions Answered: {total_questions}")
    y -= 20
    p.drawString(100, y, f"Completed: {completed_at}")
    y -= 30

    # Strengths
    if strengths:
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y, "Key Strengths:")
        y -= 18
        p.setFont("Helvetica", 12)
        for s in strengths:
            p.drawString(110, y, f"- {s}")
            y -= 15
            if y < 100:
                p.showPage()
                y = 800
        y -= 10

    # Improvements
    if improvements:
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y, "Areas for Improvement:")
        y -= 18
        p.setFont("Helvetica", 12)
        for imp in improvements:
            p.drawString(110, y, f"- {imp}")
            y -= 15
            if y < 100:
                p.showPage()
                y = 800
        y -= 10

    # Interview Summary (legacy, if present)
    interview_data = payload.get('interviewData', [])
    if interview_data:
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y, "Interview Summary:")
        y -= 18
        p.setFont("Helvetica", 12)
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
    8. Use \"you\" and \"your\" to address the candidate
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

    text = groq_chat(prompt, system_prompt="You are a helpful AI interview evaluator.", max_tokens=1024)
    return text
