from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_relevance(jd_phrases, resume_section):
    if not resume_section.strip():
        return 0.0
    scores = []
    for jd in jd_phrases:
        jd_embedding = model.encode(jd, convert_to_tensor=True)
        resume_embedding = model.encode(resume_section, convert_to_tensor=True)
        score = util.pytorch_cos_sim(jd_embedding, resume_embedding).item()
        scores.append(score)
    return round(sum(scores) / len(scores) * 100, 2)