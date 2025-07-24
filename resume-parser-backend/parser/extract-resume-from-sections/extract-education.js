const { getSectionLinesByKeywords } = require('./lib/get-section-lines');
const { divideSectionIntoSubsections } = require('./lib/subsections');
const { DATE_FEATURE_SETS, getHasText, isBold, normalizeDegree } = require('./lib/common-features');
const { getTextWithHighestFeatureScore } = require('./lib/feature-scoring-system');
const { getBulletPointsFromLines, getDescriptionsLineIdx } = require('./lib/bullet-points');

// prettier-ignore
const SCHOOLS = ['College', 'University', 'Institute', 'School', 'Academy', 'BASIS', 'Magnet'];
const hasSchool = (item) => SCHOOLS.some((school) => item.text.includes(school));
// prettier-ignore
const DEGREES = ["Associate", "Bachelor", "Master", "PhD", "Ph."];
const hasDegree = (item) => DEGREES.some((degree) => item.text.includes(degree)) || /[ABM][A-Z\.]/.test(item.text); // Match AA, B.S., MBA, etc.
const matchGPA = (item) => item.text.match(/[0-4]\.\d{1,2}/);
const matchGrade = (item) => {
  const grade = parseFloat(item.text);
  if (Number.isFinite(grade) && grade <= 110) {
    return [String(grade)];
  }
  return null;
};

const SCHOOL_FEATURE_SETS = [
  [hasSchool, 4],
  [hasDegree, -4],
];

const DEGREE_FEATURE_SETS = [
  [hasDegree, 4],
  [hasSchool, -4],
];

const GPA_FEATURE_SETS = [
  [matchGPA, 4, true],
  [matchGrade, 3, true],
  [isBold, -4],
];

function extractEducationFallback(sections) {
  // Try to find education info anywhere in the text if not found in the standard section
  const allLines = Object.values(sections).flat(2);
  const degreeRegex = /(B\.? ?Tech|Bachelor|BSc|B\.Sc|M\.? ?Tech|Master|MSc|M\.Sc|PhD|Ph\.D|Doctor)/i;
  const institutionRegex = /(IIT|Institute|University|School|College|Academy|GGSIPU|GGSIPU-EDC|GGSIPUEDC)/i;
  let found = [];
  for (const item of allLines) {
    const text = item.text || '';
    if (degreeRegex.test(text) || institutionRegex.test(text)) {
      found.push({
        school: institutionRegex.test(text) ? text.match(institutionRegex)[0] : '',
        degree: degreeRegex.test(text) ? text.match(degreeRegex)[0] : '',
        gpa: '',
        date: '',
        descriptions: [text],
      });
    }
  }
  return found;
}

const INSTITUTION_REGEX = /(College|University|Institute|School|Academy|BASIS|Magnet)/i;
const DEGREE_REGEX = /(B\.? ?Tech|B\.? ?E|BSc|B\.Sc|Bachelor|M\.? ?Tech|M\.? ?E|MSc|M\.Sc|Master|PhD|Ph\.D|Doctor|Diploma|Grade \d+)/i;
const COURSE_REGEX = /(Artificial Intelligence|Machine Learning|Computer Science|Data Science|Electronics|Mechanical|Civil|Information Technology|AIML|CS|IT|ECE|EEE|CSE|DS|AI|ML)/i;
const DATE_REGEX = /(\d{4}|Current|Present|\d{2} [A-Za-z]{3,9} \d{4}|\w+ \d{4}|\d{4} – \w+ \d{4})/i;

const extractEducation = (sections) => {
  const educations = [];
  const lines = getSectionLinesByKeywords(sections, ["education"]).flat();
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    const isInstitution = INSTITUTION_REGEX.test(text);
    const isDegree = DEGREE_REGEX.test(text);
    if (isInstitution || isDegree) {
      if (current) educations.push(current);
      current = { degree: '', course: '', college: '', date: '', descriptions: [] };
      if (isInstitution) current.college = text;
      if (isDegree) current.degree = text.match(DEGREE_REGEX)[0];
      if (COURSE_REGEX.test(text)) current.course = text.match(COURSE_REGEX)[0];
      if (DATE_REGEX.test(text)) current.date = text.match(DATE_REGEX)[0];
    } else if (current) {
      if (!current.course && COURSE_REGEX.test(text)) current.course = text.match(COURSE_REGEX)[0];
      if (!current.date && DATE_REGEX.test(text)) current.date = text.match(DATE_REGEX)[0];
      current.descriptions.push(text);
    }
  }
  if (current) educations.push(current);
  return educations;
};

module.exports = { extractEducation }; 