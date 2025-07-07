from flask import Flask, render_template, request
import os

from models.parser import extract_text_from_pdf
from gemini_summary import summarize_with_gemini

app = Flask(__name__)
UPLOAD_FOLDER = "resumes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load job description once
with open("job_description.txt", "r") as f:
    job_description = f.read().lower()

# Basic keyword extraction
job_keywords = set(job_description.split())

def calculate_match_score(resume_text):
    resume_words = resume_text.lower().split()
    matched = sum(1 for word in resume_words if word in job_keywords)
    score = (matched / len(job_keywords)) * 100
    return round(score, 2)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        resume = request.files["resume"]
        filename = resume.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        resume.save(filepath)

        text = extract_text_from_pdf(filepath)

        # Score and summary
        match_score = calculate_match_score(text)
        summary = summarize_with_gemini(text)

        return render_template("result.html", summary=summary, score=match_score)

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
