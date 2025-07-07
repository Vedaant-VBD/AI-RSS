import google.generativeai as genai

genai.configure(api_key="AIzaSyDGXlxJAllkI3BgrVXCCpESNfafdG9mEsI")

def summarize_with_gemini(resume_text):
    model = genai.GenerativeModel('gemini-2.5-pro')

    prompt = f"""
    Summarize the following resume in 4-5 bullet points highlighting key skills, experience, and qualifications:
    {resume_text}
    """

    response = model.generate_content(prompt)
    return response.text
