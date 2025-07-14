from pdfminer.high_level import extract_text

def extract_text_from_pdf(path):
    return extract_text(path)

def extract_resume_sections(text):
    sections = {
        "experience": "",
        "education": "",
        "skills": "",
    }

    lines = text.split("\n")
    current = None
    for line in lines:
        l = line.lower().strip()
        if "experience" in l:
            current = "experience"
        elif "education" in l:
            current = "education"
        elif "skills" in l:
            current = "skills"
        elif current:
            sections[current] += line + "\n"

    return sections
