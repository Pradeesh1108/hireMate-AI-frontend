import os
from dotenv import load_dotenv
import groq
import re
import json

# Load environment variables
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

def generate_questions(resume_info):
    prompt = (
        f"You are a professional talent acquisition specialist conducting an interview for an AI role. "
        f"Given this resume info: {resume_info}, generate 5 technical and behavioral interview questions for a job interview. "
        f"Questions should be short, relevant, and not boring. Return only the questions as a numbered list."
    )
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.") or ""
    questions = re.findall(r"\d+\.\s*(.*?\?)", text)
    if not questions:
        questions = [q.strip('- ').strip() for q in text.strip().split('\n') if q.strip() and '?' in q]
    return {"questions": questions}

def truncate_feedback(feedback, max_sentences=3):
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
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview evaluator.", temperature=0.5) or ""
    print('Groq raw response:', text)
    # Try to extract JSON
    result = extract_json_from_text(text)
    if result and 'feedback' in result:
        result['feedback'] = truncate_feedback(result['feedback'])
        return result
    feedback = truncate_feedback(text.strip())
    return {
        "score": None,
        "feedback": feedback,
        "strengths": None,
        "improvements": None,
        "followUpQuestions": None,
        "raw": text.strip()
    }

def extract_json_from_text(text):
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                return None
    return None

def init_cv_question_stream(cv, user_intro, client=None, model=MODEL_NAME):
    prompt = f"""You are professional talent acquisition specialist conducting an interview for an AI role.\nYour task is to start a conversation with the candidate after he introduced himself.\nYou have access to the candidate's CV.\nThe question should be short and not boring.\nThe text you will generate will be read by a text-to-speech engine, so you can add vocalized text if you want.\nYou should not explain the beginning of the conversation or the context of the question.\nTalk directly to the candidate.\nBe kind, nice, helpful, and professional.\nYou need to keep it a natural conversation.\nYou need to be human-like, and to interact with the last thing that the candidate said.\nCandidate Introduction: {user_intro}\nCV: {cv}\n\nConversation Start: """
    return groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.")

def stream_next_cv_question(client=None, model=MODEL_NAME, cv=None, chat_history=None):
    prompt = f"""You are professional talent acquisition specialist conducting an interview for an AI role.\nYour task is to continue the conversation with the candidate after he answered the previous question.\nContinue the conversation and do not begin a new one.\nYou have access to the candidate's CV.\nThe question should be short and not boring.\nThe question should not be long!\nThe text you will generate will be read by a text-to-speech engine, so you can add vocalized text if you want.\nYou should not explain the beginning of the conversation or the context of the question.\nDon't repeat previous questions.\nBefore asking the question, give a natural transition from the previous answer.\nDon't explain anything, and don't give any notes.\nTalk directly to the candidate.\nBe kind, nice, helpful, and professional.\nYou need to keep it a natural conversation.\nChat History: {chat_history}\nCV: {cv}\n\nConversation Continuity: """
    return groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.")

def reformulate_question(client=None, model=MODEL_NAME, question_data=None):
    if not question_data:
        return "No question data provided."
    prompt = f"""You are a professional technical interviewer conducting an interview for an AI role.\nYour task is to reformulate the following technical question to make it more conversational and suitable for a verbal interview.\nThe reformulated question should be clear, concise, and natural sounding when read aloud by a text-to-speech system.\nDo not change the technical content or difficulty of the question.\n\nOriginal Question: {question_data['question']}\n\nTopic: {question_data.get('main_subject', '')}\nDifficulty: {question_data.get('difficulty', '')}\n\nPlease provide only the reformulated question without any additional text, explanations, or context.\n"""
    return groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.")

def generate_interview_questions(resume_text):
    prompt = (
        "You are a professional technical interviewer. "
        "Given the following resume, generate 6 diverse interview questions for a technical interview. "
        "The questions should cover: 1) projects/experience, 2) technical skills, 3) education/background, 4) behavioral/soft skills, 5) problem-solving, 6) motivation/career goals. "
        "Questions should be clear, relevant, and not generic. Return ONLY a JSON array of 6 questions.\n"
        f"Resume: {resume_text}"
    )
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.") or ""
    print('Groq raw questions:', text)
    try:
        questions = json.loads(text)
        if isinstance(questions, list) and len(questions) == 6:
            return questions
    except Exception:
        pass
    lines = [l.strip('- ').strip() for l in text.split('\n') if '?' in l]
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
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview evaluator.", temperature=0.5) or ""
    print('Groq raw evaluation:', text)
    result = extract_json_from_text(text)
    if result and 'feedback' in result:
        result['feedback'] = truncate_feedback(result['feedback'])
        return result
    feedback = truncate_feedback(text.strip())
    return {
        "score": None,
        "feedback": feedback,
        "strengths": None,
        "improvements": None,
        "followUpQuestions": None,
        "raw": text.strip()
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
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview evaluator.") or ""
    print('Groq raw report:', text)
    return text.strip()

def next_interview_question(resume_text, chat_history, user_intro=None):
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
    text = groq_chat(prompt, system_prompt="You are a helpful AI interview assistant.") or ""
    print('Groq next question:', text)
    lines = [l.strip('- ').strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines) if lines else 'Can you tell me more about your experience?'
