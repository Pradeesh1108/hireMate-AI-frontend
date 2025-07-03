import tempfile
import os
import cv2
import numpy as np
import pytesseract
from pdf2image import convert_from_path
from keybert import KeyBERT
import spacy

# Load spaCy model globally
nlp = spacy.load('en_core_web_sm')
keybert_model = KeyBERT(nlp)  # type: ignore

def extract_text_from_pdf_ocr(uploaded_file):
    text = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(uploaded_file.read())
            tmp_file.seek(0)
            images = convert_from_path(tmp_file.name)
            for image in images:
                image_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
                text += pytesseract.image_to_string(gray) + "\n"
    except Exception as e:
        print(f"Error extracting text using OCR: {str(e)}")
        return ""
    finally:
        if 'tmp_file' in locals():
            os.unlink(tmp_file.name)
    return text.strip()

def preprocess_text(text):
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    return " ".join(tokens)

def extract_keywords(text):
    # Use KeyBERT with spaCy model for lightweight keyword extraction
    keywords = keybert_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=100)
    return [kw[0] for kw in keywords]

def calculate_similarity(resume_text, job_description):
    # Use spaCy's built-in similarity (no torch required)
    doc1 = nlp(resume_text)
    doc2 = nlp(job_description)
    return doc1.similarity(doc2)

def extract_name_from_resume(text):
    doc = nlp(text)
    # Find the first PERSON entity
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            return ent.text
    return None 