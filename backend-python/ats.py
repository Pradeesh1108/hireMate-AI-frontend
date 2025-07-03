import PyPDF2
import io

def analyze_resume(pdf_bytes, job_description):
    # Extract text from PDF
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    # Dummy ATS score logic (replace with real logic)
    ats_score = min(100, len(set(job_description.lower().split()) & set(text.lower().split())) * 10)
    return {
        "atsScore": ats_score,
        "resumeText": text,
        "jobDescription": job_description
    } 