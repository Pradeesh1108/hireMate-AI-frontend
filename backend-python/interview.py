import os
from dotenv import load_dotenv
import google.generativeai as genai  # pyright: ignore
import re
import json

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
MODEL_NAME = "gemini-1.5-flash"

# Configure Gemini
genai.configure(api_key=API_KEY)  # pyright: ignore

def generate_questions(resume_info):
    prompt = (
        f"You are a professional talent acquisition specialist conducting an interview for an AI role. "
        f"Given this resume info: {resume_info}, generate 5 technical and behavioral interview questions for a job interview. "
        f"Questions should be short, relevant, and not boring."
    )
    model_instance = genai.GenerativeModel("gemini-1.5-flash")  # pyright: ignore
    response = model_instance.generate_content(prompt)
    questions = [q.strip('- ').strip() for q in response.text.strip().split('\n') if q.strip()]
    questions = [q for q in questions if '?' in q]
    return {"questions": questions}

def extract_json_from_text(text):
    # Try to find a JSON block in the text (even if wrapped in markdown)
    match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text)
    if match:
        json_str = match.group(1)
    else:
        # Try to find the first {...} block
        match = re.search(r'(\{[\s\S]*\})', text)
        json_str = match.group(1) if match else None
    if json_str:
        try:
            return json.loads(json_str)
        except Exception:
            pass
    return None

def truncate_feedback(feedback, max_sentences=3):
    # Split feedback into sentences and return only the first few
    import re
    sentences = re.split(r'(?<=[.!?]) +', feedback)
    return ' '.join(sentences[:max_sentences]).strip()

def evaluate_answer(payload):
    question = payload.get("question")
    answer = payload.get("answer")
    prompt = (
        f"You are an expert AI interviewer.\n"
        f"Interview Question: {question}\n"
        f"Candidate Answer: {answer}\n"
        "Evaluate ONLY THIS answer for clarity, relevance, and depth. "
        "Provide a score out of 10 and a short feedback string (2-3 sentences). "
        "Respond ONLY with a valid JSON object with keys: score, feedback, strengths, improvements, followUpQuestions. "
        "Do NOT summarize the whole interview. Do NOT generate a report. Do NOT include any extra text, markdown, or a full report."
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    print('Gemini raw response:', response.text)

    # Try to extract JSON
    result = extract_json_from_text(response.text)
    if result and 'feedback' in result:
        # Truncate feedback to first 2-3 sentences
        result['feedback'] = truncate_feedback(result['feedback'])
        return result

    # Fallback: treat the whole text as feedback
    feedback = truncate_feedback(response.text.strip())
    return {
        "score": None,
        "feedback": feedback,
        "strengths": None,
        "improvements": None,
        "followUpQuestions": None,
        "raw": response.text.strip()
    }

def init_cv_question_stream(cv, user_intro, client=None, model=MODEL_NAME):
    prompt = f"""You are professional talent acquisition specialist conducting an interview for an AI role.
Your task is to start a conversation with the candidate after he introduced himself.
You have access to the candidate's CV so you can ask him about one or more of his projects/experiences.
The question should be short and not boring.
The text you will generate will be read by a text-to-speech engine, so you can add vocalized text if you want.
You should not explain the beginning of the conversation or the context of the question.
Talk directly to the candidate.
Be kind, nice, helpful, and professional.
You need to keep it a natural conversation.
You need to be human-like, and to interact with the last thing that the candidate said.
Candidate Introduction: {user_intro}
CV: {cv}

Conversation Start: """
    model_instance = genai.GenerativeModel(model)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    return response.text

def stream_next_cv_question(client=None, model=MODEL_NAME, cv=None, chat_history=None):
    prompt = f"""You are professional talent acquisition specialist conducting an interview for an AI role.
Your task is to continue the conversation with the candidate after he answered the previous question.
Continue the conversation and do not begin a new one.
You have access to the candidate's CV so you can ask him about one or more of his projects/experiences.
The question should be short and not boring.
The question should not be long!
The text you will generate will be read by a text-to-speech engine, so you can add vocalized text if you want.
You should not explain the beginning of the conversation or the context of the question.
Don't repeat previous questions.
Before asking the question, give a natural transition from the previous answer.
Don't explain anything, and don't give any notes.
Talk directly to the candidate.
Be kind, nice, helpful, and professional.
You need to keep it a natural conversation.
Chat History: {chat_history}
CV: {cv}

Conversation Continuity: """
    model_instance = genai.GenerativeModel(model)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    return response.text

def reformulate_question(client=None, model=MODEL_NAME, question_data=None):
    if not question_data:
        return "No question data provided."
    prompt = f"""You are a professional technical interviewer conducting an interview for an AI role.
Your task is to reformulate the following technical question to make it more conversational and suitable for a verbal interview.
The reformulated question should be clear, concise, and natural sounding when read aloud by a text-to-speech system.
Do not change the technical content or difficulty of the question.

Original Question: {question_data['question']}

Topic: {question_data.get('main_subject', '')}
Difficulty: {question_data.get('difficulty', '')}

Please provide only the reformulated question without any additional text, explanations, or context.
"""
    model_instance = genai.GenerativeModel(model)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    return response.text

def generate_interview_questions(resume_text):
    prompt = (
        "You are a professional technical interviewer. "
        "Given the following resume, generate 6 diverse interview questions for a technical interview. "
        "The questions should cover: 1) projects/experience, 2) technical skills, 3) education/background, 4) behavioral/soft skills, 5) problem-solving, 6) motivation/career goals. "
        "Questions should be clear, relevant, and not generic. Return ONLY a JSON array of 6 questions.\n"
        f"Resume: {resume_text}"
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    print('Gemini raw questions:', response.text)
    # Try to extract JSON array
    try:
        questions = json.loads(response.text)
        if isinstance(questions, list) and len(questions) == 6:
            return questions
    except Exception:
        pass
    # Fallback: extract lines that look like questions
    lines = [l.strip('- ').strip() for l in response.text.split('\n') if '?' in l]
    return lines[:6]

def evaluate_single_answer(question, answer, resume_text):
    prompt = (
        "You are an expert technical interviewer.\n"
        f"Resume: {resume_text}\n"
        f"Interview Question: {question}\n"
        f"Candidate Answer: {answer}\n"
        "Evaluate ONLY THIS answer for clarity, relevance, and depth. "
        "Provide a score out of 10 and a short feedback string (2-3 sentences). "
        "Respond ONLY with a valid JSON object with keys: score, feedback, strengths, improvements, followUpQuestions. "
        "Do NOT summarize the whole interview. Do NOT generate a report. Do NOT include any extra text, markdown, or a full report."
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    print('Gemini raw evaluation:', response.text)
    result = extract_json_from_text(response.text)
    if result and 'feedback' in result:
        result['feedback'] = truncate_feedback(result['feedback'])
        return result
    feedback = truncate_feedback(response.text.strip())
    return {
        "score": None,
        "feedback": feedback,
        "strengths": None,
        "improvements": None,
        "followUpQuestions": None,
        "raw": response.text.strip()
    }

def generate_final_report(interview_data, user_name=None):
    prompt = (
        "You are an expert AI interviewer tasked with evaluating a candidate's technical interview performance.\n"
        f"Candidate Name: {user_name if user_name else 'N/A'}\n"
        "Based on the interview questions, expected answers, and the candidate's actual responses, provide a comprehensive evaluation report.\n"
        "Your report should include: 1) overall assessment, 2) strengths, 3) areas for improvement, 4) detailed feedback on each question, 5) recommendations.\n"
        "Be professional, direct, and constructive.\n"
        f"Interview Data: {json.dumps(interview_data)}"
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    print('Gemini raw report:', response.text)
    return response.text.strip()

def next_interview_question(resume_text, chat_history, user_intro=None):
    # chat_history: list of {question, answer}
    if user_intro and not chat_history:
        intro_part = f"The candidate introduced themselves as: {user_intro}\n"
    else:
        intro_part = ""
    prompt = (
        "You are a professional technical interviewer. "
        "Given the following resume and the previous interview questions and answers, generate the next interview question for a technical interview. "
        f"{intro_part}"
        "First, briefly comment on the candidate's most recent answer (if any), making the transition natural and conversational. "
        "Then, ask the next interview question. "
        "Ensure that over the course of 6 questions, you cover: 1) projects/experience, 2) technical skills, 3) education/background, 4) behavioral/soft skills, 5) problem-solving, 6) motivation/career goals. "
        "Do NOT repeat topics already covered. "
        "Ask a clear, relevant, and non-generic question. "
        "Return ONLY the combined comment and next question as plain text, no explanations, no markdown, no JSON.\n"
        f"Resume: {resume_text}\n"
        f"Previous Q&A: {json.dumps(chat_history)}"
    )
    model_instance = genai.GenerativeModel(MODEL_NAME)  # pyright: ignore
    response = model_instance.generate_content(prompt)
    print('Gemini next question:', response.text)
    # Return the first non-empty block
    lines = [l.strip('- ').strip() for l in response.text.split('\n') if l.strip()]
    return '\n'.join(lines) if lines else 'Can you tell me more about your experience?'
