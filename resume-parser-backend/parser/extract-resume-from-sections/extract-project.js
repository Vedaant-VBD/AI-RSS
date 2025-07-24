const { getSectionLinesByKeywords } = require('./lib/get-section-lines');
const { DATE_FEATURE_SETS, isBold } = require('./lib/common-features');
const { divideSectionIntoSubsections } = require('./lib/subsections');
const { getTextWithHighestFeatureScore } = require('./lib/feature-scoring-system');
const { getBulletPointsFromLines, getDescriptionsLineIdx } = require('./lib/bullet-points');

const extractProject = (sections) => {
  const projects = [];
  const lines = getSectionLinesByKeywords(sections, ["project"]);
  const subsections = divideSectionIntoSubsections(lines);

  for (const subsectionLines of subsections) {
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines) ?? 1;
    const subsectionInfoTextItems = subsectionLines.slice(0, descriptionsLineIdx).flat();
    const [date] = getTextWithHighestFeatureScore(subsectionInfoTextItems, DATE_FEATURE_SETS);
    // Remove FeatureSet and getHasText usage, use only available feature sets
    const PROJECT_FEATURE_SETS = [
      [isBold, 2],
      DATE_FEATURE_SETS[0],
    ];
    const [project] = getTextWithHighestFeatureScore(subsectionInfoTextItems, PROJECT_FEATURE_SETS, false);
    const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
    const descriptions = getBulletPointsFromLines(descriptionsLines);
    projects.push({ project, date, descriptions });
  }
  return projects;
};

module.exports = { extractProject }; 