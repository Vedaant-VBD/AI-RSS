const isTextItemBold = (fontName) =>
  fontName.toLowerCase().includes("bold");
const isBold = (item) => isTextItemBold(item.fontName);
const hasLetter = (item) => /[a-zA-Z]/.test(item.text);
const hasNumber = (item) => /[0-9]/.test(item.text);
const hasComma = (item) => item.text.includes(",");
const getHasText = (text) => (item) => item.text.includes(text);
const hasOnlyLettersSpacesAmpersands = (item) => /^[A-Za-z\s&]+$/.test(item.text);
const hasLetterAndIsAllUpperCase = (item) => hasLetter(item) && item.text.toUpperCase() === item.text;
// Date Features
const hasYear = (item) => /(?:19|20)\d{2}/.test(item.text);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hasMonth = (item) =>
  MONTHS.some(
    (month) =>
      item.text.includes(month) || item.text.includes(month.slice(0, 4))
  );
const SEASONS = ["Summer", "Fall", "Spring", "Winter"];
const hasSeason = (item) =>
  SEASONS.some((season) => item.text.includes(season));
const hasPresent = (item) => item.text.includes("Present");
const DATE_FEATURE_SETS = [
  [hasYear, 1],
  [hasMonth, 1],
  [hasSeason, 1],
  [hasPresent, 1],
  [hasComma, -1],
];
// Degree and skill normalization map
// Expanded degree synonyms
const DEGREE_SYNONYMS = {
  "btech": "Bachelor of Technology",
  "bachelor of technology": "Bachelor of Technology",
  "b.tech": "Bachelor of Technology",
  "b. tech": "Bachelor of Technology",
  "b.sc": "Bachelor of Science",
  "bsc": "Bachelor of Science",
  "bachelor of science": "Bachelor of Science",
  "mtech": "Master of Technology",
  "master of technology": "Master of Technology",
  "msc": "Master of Science",
  "m.sc": "Master of Science",
  "master of science": "Master of Science",
  "phd": "Doctor of Philosophy",
  "ph.d": "Doctor of Philosophy",
  "doctor of philosophy": "Doctor of Philosophy",
  // Add more as needed
};

function normalizeDegree(degree) {
  if (!degree) return degree;
  const key = degree.trim().toLowerCase().replace(/\./g, "");
  if (DEGREE_SYNONYMS[key]) return DEGREE_SYNONYMS[key];
  // Fuzzy match
  const match = fuzzyMatch(key, Object.keys(DEGREE_SYNONYMS));
  return match ? DEGREE_SYNONYMS[match] : degree;
}

// Expanded skill synonyms
const SKILL_SYNONYMS = {
  "js": "JavaScript",
  "javascript": "JavaScript",
  "javscript": "JavaScript",
  "py": "Python",
  "python": "Python",
  "c++": "C++",
  "cpp": "C++",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "reactjs": "React",
  "react": "React",
  "html5": "HTML",
  "html": "HTML",
  "css3": "CSS",
  "css": "CSS",
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ai": "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  // Add more as needed
};

function normalizeSkill(skill) {
  if (!skill) return skill;
  const key = skill.trim().toLowerCase();
  if (SKILL_SYNONYMS[key]) return SKILL_SYNONYMS[key];
  // Fuzzy match
  const match = fuzzyMatch(key, Object.keys(SKILL_SYNONYMS));
  return match ? SKILL_SYNONYMS[match] : skill;
}

// Fuzzy string matching utility (Levenshtein distance, simple version)
function fuzzyMatch(str, arr, threshold = 0.8) {
  if (!str) return null;
  str = str.trim().toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const candidate of arr) {
    const score = stringSimilarity(str, candidate.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore >= threshold ? best : null;
}

// Simple similarity: ratio of matching chars (not true Levenshtein, but fast)
function stringSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

module.exports = {
  isBold,
  hasLetter,
  hasNumber,
  hasComma,
  getHasText,
  hasOnlyLettersSpacesAmpersands,
  hasLetterAndIsAllUpperCase,
  DATE_FEATURE_SETS,
  normalizeDegree,
  normalizeSkill,
  fuzzyMatch,
}; 