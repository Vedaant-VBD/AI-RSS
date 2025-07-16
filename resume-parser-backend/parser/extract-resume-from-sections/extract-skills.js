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

const extractSkills = (sections) => {
  const lines = getSectionLinesByKeywords(sections, SKILL_SECTION_KEYWORDS);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const featuredSkills = initialFeaturedSkills.map(s => ({ ...s }));
  if (descriptionsLineIdx !== 0) {
    const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
    const featuredSkillsTextItems = featuredSkillsLines
      .flat()
      .filter(item => item.text && item.text.trim())
      .slice(0, 6);
    for (let i = 0; i < featuredSkillsTextItems.length; i++) {
      featuredSkills[i].skill = featuredSkillsTextItems[i].text;
    }
  }

  // Split and flatten all skills from descriptions
  const allSkills = splitSkillsFromDescriptions(descriptions).map(normalizeSkill);

  const skills = {
    featuredSkills,
    descriptions: allSkills,
  };

  return { skills };
};

module.exports = { extractSkills }; 