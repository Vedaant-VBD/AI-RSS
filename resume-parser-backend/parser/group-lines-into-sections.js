const {
  hasLetterAndIsAllUpperCase,
  hasOnlyLettersSpacesAmpersands,
  isBold,
  fuzzyMatch,
} = require("./extract-resume-from-sections/lib/common-features");

const PROFILE_SECTION = "profile";

/**
 * Step 3. Group lines into sections
 *
 * Every section (except the profile section) starts with a section title that
 * takes up the entire line. This is a common pattern not just in resumes but
 * also in books and blogs. The resume parser uses this pattern to group lines
 * into the closest section title above these lines.
 */
const groupLinesIntoSections = (lines) => {
  let sections = {};
  let sectionName = PROFILE_SECTION;
  let sectionLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line[0]?.text.trim();
    if (isSectionTitle(line, i)) {
      sections[sectionName] = [...sectionLines];
      sectionName = text;
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }
  if (sectionLines.length > 0) {
    sections[sectionName] = [...sectionLines];
  }
  return sections;
};

const SECTION_TITLE_PRIMARY_KEYWORDS = [
  "experience",
  "education",
  "project",
  "skill",
  // CV-specific and international terms
  "profile",
  "summary",
  "professional experience",
  "work history",
  "employment",
  "academic background",
  "qualifications",
  "certifications",
  "languages",
  "publications",
  "research",
  "interests",
  "achievements",
  "awards",
  "training",
  "references",
  "curriculum vitae",
  "cv"
];
const SECTION_TITLE_SECONDARY_KEYWORDS = [
  "job",
  "course",
  "extracurricular",
  "objective",
  "summary", // LinkedIn generated resume has a summary section
  "award",
  "honor",
  "project",
  // More CV-specific
  "personal information",
  "contact",
  "contact information",
  "skills and competencies",
  "technical skills",
  "soft skills",
  "volunteer",
  "volunteering",
  "affiliations",
  "memberships"
];
const SECTION_TITLE_KEYWORDS = [
  ...SECTION_TITLE_PRIMARY_KEYWORDS,
  ...SECTION_TITLE_SECONDARY_KEYWORDS,
];

const isSectionTitle = (line, lineNumber) => {
  const isFirstTwoLines = lineNumber < 2;
  const hasMoreThanOneItemInLine = line.length > 1;
  const hasNoItemInLine = line.length === 0;
  if (isFirstTwoLines || hasMoreThanOneItemInLine || hasNoItemInLine) {
    return false;
  }

  const textItem = line[0];

  // The main heuristic to determine a section title is to check if the text is double emphasized
  // to be both bold and all uppercase, which is generally true for a well formatted resume
  if (isBold(textItem) && hasLetterAndIsAllUpperCase(textItem)) {
    return true;
  }

  // The following is a fallback heuristic to detect section title if it includes a keyword match
  // (This heuristics is not well tested and may not work well)
  const text = textItem.text.trim();
  const textHasAtMost2Words =
    text.split(" ").filter((s) => s !== "&").length <= 2;
  const startsWithCapitalLetter = /[A-Z]/.test(text.slice(0, 1));

  // Fuzzy match section header
  const fuzzySection = fuzzyMatch(text.toLowerCase(), SECTION_TITLE_KEYWORDS.map(k => k.toLowerCase()), 0.75);

  if (
    textHasAtMost2Words &&
    hasOnlyLettersSpacesAmpersands(textItem) &&
    startsWithCapitalLetter &&
    fuzzySection
  ) {
    return true;
  }

  return false;
};

module.exports = { groupLinesIntoSections, PROFILE_SECTION }; 