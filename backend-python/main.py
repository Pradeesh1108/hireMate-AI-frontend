from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from interview import generate_questions, evaluate_answer, init_cv_question_stream, stream_next_cv_question, generate_interview_questions, evaluate_single_answer, generate_final_report, next_interview_question
from career import career_assistant
from report import generate_report, generate_evaluation_report
from utils import extract_text_from_pdf_ocr, calculate_similarity, extract_name_from_resume
from speech_to_text import convert_audio_to_text
import os
import io
import logging
import traceback

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hire-mate-ai-green.vercel.app",  # Vercel frontend
        "http://localhost:5173",                  # local dev (optional)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze-resume")
async def analyze_resume(resume: UploadFile = File(...), job_description: str = Form(...)):
    # Extract text from PDF (OCR)
    resume.file.seek(0)
    resume_text = extract_text_from_pdf_ocr(resume.file)
    # Calculate ATS score
    ats_score = calculate_similarity(resume_text, job_description)
    return {"atsScore": round(ats_score * 100, 2), "resumeText": resume_text}

@app.post("/api/interview/start")
async def interview_start(request: Request):
    try:
        data = await request.json()
        resume_text = data.get("resumeText")
        if not resume_text:
            return JSONResponse(status_code=400, content={"error": "Missing resumeText"})
        questions = generate_interview_questions(resume_text)
        return {"questions": questions}
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/interview/evaluate")
async def interview_evaluate(request: Request):
    try:
        data = await request.json()
        question = data.get("question")
        answer = data.get("answer")
        resume_text = data.get("resumeText")
        if not question or not answer or not resume_text:
            return JSONResponse(status_code=400, content={"error": "Missing question, answer, or resumeText"})
        result = evaluate_single_answer(question, answer, resume_text)
        return result
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/interview/report")
async def interview_report(request: Request):
    try:
        data = await request.json()
        interview_data = data.get("interviewData")
        user_name = data.get("userName")
        resume_text = data.get("resumeText")
        if not interview_data:
            return JSONResponse(status_code=400, content={"error": "Missing interviewData"})
        # If user_name is not provided, try to extract from resume_text
        if not user_name and resume_text:
            user_name = extract_name_from_resume(resume_text)
        report = generate_final_report(interview_data, user_name)
        return {"report": report}
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/interview/next-question")
async def interview_next_question(request: Request):
    try:
        data = await request.json()
        resume_text = data.get("resumeText")
        chat_history = data.get("chatHistory")
        user_intro = data.get("userIntro")
        if not resume_text or chat_history is None:
            return JSONResponse(status_code=400, content={"error": "Missing resumeText or chatHistory"})
        question = next_interview_question(resume_text, chat_history, user_intro)
        return {"question": question}
    except Exception as e:
        print(traceback.format_exc())
        if "quota" in str(e).lower() or "ResourceExhausted" in str(e):
            return JSONResponse(status_code=429, content={"error": "Gemini API quota exceeded. Please try again later or upgrade your plan."})
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/career-coach")
async def career_coach(request: Request):
    data = await request.json()
    resume_text = data.get("resumeText")
    job_description = data.get("jobDescription")
    user_message = data.get("userMessage")
    response = career_assistant({
        "resumeText": resume_text,
        "jobDescription": job_description,
        "message": user_message
    })
    return response

@app.post("/api/generate-questions")
async def generate_questions_endpoint(resume_info: dict):
    result = generate_questions(resume_info)
    return JSONResponse(content=result)

@app.post("/api/evaluate-answer")
async def evaluate_answer_endpoint(payload: dict):
    result = evaluate_answer(payload)
    return JSONResponse(content=result)

@app.post("/api/generate-report")
async def generate_report_endpoint(payload: dict):
    pdf_bytes = generate_report(payload)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=CareerMate-Report.pdf"})

@app.post("/api/extract-name")
async def extract_name_endpoint(request: Request):
    data = await request.json()
    resume_text = data.get("resumeText", "")
    name = extract_name_from_resume(resume_text) or ""
    return {"name": name}

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify the server is running"""
    return {"message": "Backend server is running!", "status": "ok"}

@app.post("/api/speech-to-text")
async def speech_to_text_endpoint(audio: UploadFile = File(...)):
    """
    Convert uploaded audio file to text using Google Speech Recognition
    """
    try:
        # Read the uploaded audio file
        audio_data = await audio.read()
        
        # Get the file extension to determine format
        file_extension = audio.filename.split('.')[-1].lower() if audio.filename else 'webm'
        print(f"Received audio file: {audio.filename}, detected format: {file_extension}")
        
        # Convert audio to text
        result = convert_audio_to_text(audio_data, file_extension)
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "text": result["text"],
                "error": None
            })
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "text": "",
                    "error": result["error"]
                }
            )
            
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "text": "",
                "error": f"Error processing audio: {str(e)}"
            }
        ) 