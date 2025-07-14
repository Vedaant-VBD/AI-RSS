from flask import Flask, render_template, request
import os
from models.parser import extract_text_from_pdf, extract_resume_sections
from gemini_summary import summarize_with_gemini
from semantic_score import compute_relevance

app = Flask(__name__)
UPLOAD_FOLDER = "resumes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        resume = request.files["resume"]
        filename = resume.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        resume.save(filepath)

        # Choose which job description to load
        jd_file = request.form.get("jd_file", "job_description1.txt")
        with open(jd_file, "r") as f:
            job_keywords = [line.strip() for line in f.readlines() if line.strip()]

        # Parse resume
        resume_text = extract_text_from_pdf(filepath)
        sections = extract_resume_sections(resume_text)

        # Smart scoring
        experience_score = compute_relevance(job_keywords, sections["experience"])
        skills_score = compute_relevance(job_keywords, sections["skills"])
        final_score = round(0.6 * experience_score + 0.4 * skills_score, 2)

        # Gemini Summary
        summary = summarize_with_gemini(resume_text)

        return render_template("result.html", score=final_score, summary=summary)

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)