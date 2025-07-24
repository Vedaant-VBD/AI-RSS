const { deepClone } = require('./lib/deep-clone');
const { getSectionLinesByKeywords } = require('./lib/get-section-lines');
const { getBulletPointsFromLines, getDescriptionsLineIdx } = require('./lib/bullet-points');
const { normalizeSkill } = require('./lib/common-features');

const initialFeaturedSkills = [
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
  { skill: "" },
];

const SKILL_SECTION_KEYWORDS = [
  "skill", "skills", "technical skills", "core competencies", "competencies", "technologies", "tools"
];

function splitSkillsFromDescriptions(descriptions) {
  const splitRegex = /[\/,|•;\n]+/;
  return descriptions
    .flatMap(desc => desc.split(splitRegex))
    .map(s => s.trim())
    .filter(Boolean);
}

function extractSkillsFallback(sections) {
  // Try to find skills info anywhere in the text if not found in the standard section
  const allLines = Object.values(sections).flat(2);
  const skillRegex = /python|java|c#|c\+\+|ml|machine learning|scikit-learn|tensorflow|sql|git|docker|unity|opencv|react|javascript|html|css|blockchain|vr|game|leadership|problem solving|communication|dsa/i;
  let found = [];
  for (const item of allLines) {
    const text = item.text || '';
    const matches = text.match(new RegExp(skillRegex, 'gi'));
    if (matches) {
      found.push(...matches.map(s => s.trim()));
    }
  }
  // Remove duplicates
  return Array.from(new Set(found));
}

const SKILL_REGEX = /[a-zA-Z\+\#\.\-]+/g;
const extractSkills = (sections) => {
  const lines = getSectionLinesByKeywords(sections, ["skill"]);
  // Flatten and extract skill-like words/phrases
  const skills = lines.flat()
    .map(item => item.text)
    .filter(Boolean)
    .flatMap(text => (text.match(SKILL_REGEX) || []))
    .map(skill => skill.trim())
    .filter(skill => skill.length > 1);
  // Remove duplicates
  return Array.from(new Set(skills));
};

module.exports = { extractSkills }; 